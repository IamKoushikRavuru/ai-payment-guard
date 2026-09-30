"""
Transaction Processing and Query Routes.
Implements the complete layered security pipeline for incoming payment transactions.
"""

from __future__ import annotations

import time
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import get_settings
from backend.app.database.connection import get_db_session
from backend.app.database.repositories import SecurityEventRepository, TransactionRepository
from backend.app.schemas.transaction import (
    TransactionCreateRequest,
    TransactionListResponse,
    TransactionResponse,
)
from backend.app.services.observability import observability_service
from backend.app.services.payment_gateway import payment_gateway
from backend.app.services.risk_engine import risk_engine

router = APIRouter(prefix="/api/v1/transactions", tags=["Transactions"])
settings = get_settings()


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED, summary="Process Payment Transaction")
async def create_transaction(
    req: TransactionCreateRequest,
    session: AsyncSession = Depends(get_db_session),
) -> TransactionResponse:
    """
    Submits a payment instruction through the full AI-Native layered security engine.
    Pipeline: Prompt Scan -> Financial Policy Check -> Gate Validation -> DLP -> Risk Engine -> Ledger.
    """
    start_time = time.perf_counter()
    tx_repo = TransactionRepository(session)

    # 1. Determine benchmark rate and optimal route if not provided
    try:
        benchmark_rate = payment_gateway.get_market_exchange_rate(req.source_currency, req.destination_currency)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    route = req.route or payment_gateway.select_optimal_corridor(
        req.destination_currency, req.destination_country, req.amount
    )
    dest_amount = round(req.amount * benchmark_rate, 2)

    # 2. Execute Layered Risk Assessment
    assessment = risk_engine.assess(
        prompt=req.user_prompt or f"Transfer {req.amount} {req.source_currency} to {req.destination_country}",
        transaction_params={
            "source_currency": req.source_currency,
            "destination_currency": req.destination_currency,
            "amount": req.amount,
            "exchange_rate": benchmark_rate,
            "destination_amount": dest_amount,
            "destination_country": req.destination_country,
            "route": route,
        },
    )

    # Determine Transaction Status
    if assessment.recommended_action == "BLOCK":
        tx_status = "BLOCKED"
    elif assessment.recommended_action == "FLAG":
        tx_status = "FLAGGED"
    else:
        tx_status = "APPROVED"

    latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
    tx_id = f"tx_{uuid.uuid4().hex[:12]}"

    # 3. Persist Transaction in Ledger
    tx = await tx_repo.create({
        "id": tx_id,
        "user_id": req.user_id,
        "source_currency": req.source_currency.upper(),
        "destination_currency": req.destination_currency.upper(),
        "amount": req.amount,
        "exchange_rate": benchmark_rate,
        "destination_amount": dest_amount,
        "destination_country": req.destination_country.upper(),
        "route": route,
        "status": tx_status,
        "risk_score": assessment.risk_score,
        "decision_reason": assessment.summary_explanation,
        "execution_latency_ms": latency_ms,
    })

    # 4. Record Security Events for Firing Threats
    for sig in assessment.signals:
        if sig.is_threat:
            await observability_service.record_security_event(
                session=session,
                event_type=sig.detector.upper(),
                severity=sig.severity,
                risk_score=sig.risk_score,
                confidence=sig.confidence,
                source=sig.detector,
                description=sig.explanation,
                action=assessment.recommended_action,
                transaction_id=tx_id,
                payload_snippet=req.user_prompt,
            )

    return TransactionResponse.model_validate(tx)


@router.get("", response_model=TransactionListResponse, summary="List Recent Transactions")
async def list_transactions(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    session: AsyncSession = Depends(get_db_session),
) -> TransactionListResponse:
    """Retrieves paginated transactions from the audit ledger."""
    tx_repo = TransactionRepository(session)
    items = await tx_repo.list_recent(limit=limit, offset=offset)
    total = await tx_repo.count_all()
    return TransactionListResponse(
        total=total,
        items=[TransactionResponse.model_validate(t) for t in items],
    )


@router.get("/{transaction_id}", response_model=TransactionResponse, summary="Get Transaction by ID")
async def get_transaction(
    transaction_id: str,
    session: AsyncSession = Depends(get_db_session),
) -> TransactionResponse:
    """Fetches full transaction audit record by transaction ID."""
    tx_repo = TransactionRepository(session)
    tx = await tx_repo.get_by_id(transaction_id)
    if not tx:
        raise HTTPException(status_code=404, detail=f"Transaction '{transaction_id}' not found.")
    return TransactionResponse.model_validate(tx)
