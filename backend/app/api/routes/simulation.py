"""
Simulation and Red-Team Traffic Generator API Routes.
"""

from __future__ import annotations

import time
import uuid
from typing import Any, Dict, List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.connection import get_db_session
from backend.app.database.models import SimulationRunModel
from backend.app.database.repositories import TransactionRepository
from backend.app.schemas.transaction import SimulationRunRequest
from backend.app.services.observability import observability_service
from backend.app.services.payment_gateway import payment_gateway
from backend.app.services.risk_engine import risk_engine
from backend.app.services.transaction_simulator import TransactionSimulator

router = APIRouter(prefix="/api/v1/simulation", tags=["Traffic & Attack Simulation"])


@router.post("/run", summary="Run Payment Traffic or Attack Simulation")
async def run_simulation(
    req: SimulationRunRequest,
    session: AsyncSession = Depends(get_db_session),
) -> Dict[str, Any]:
    """
    Executes a reproducible batch of simulated transactions (normal, adversarial, or red-team)
    through the live layered security engine and commits audit events.
    """
    start_time = time.perf_counter()
    simulator = TransactionSimulator(seed=req.random_seed)
    scenarios = simulator.generate_batch(count=req.count, scenario_type=req.scenario_type)

    tx_repo = TransactionRepository(session)

    results: List[Dict[str, Any]] = []
    blocked_count = 0
    flagged_count = 0
    approved_count = 0
    alerts_count = 0

    for sc in scenarios:
        # Determine exchange rate
        try:
            rate = payment_gateway.get_market_exchange_rate(sc["source_currency"], sc["destination_currency"])
        except Exception:
            rate = 1.0

        dest_amt = round(sc["amount"] * rate, 2)

        # Run assessment
        assessment = risk_engine.assess(
            prompt=sc["prompt"],
            transaction_params={
                "source_currency": sc["source_currency"],
                "destination_currency": sc["destination_currency"],
                "amount": sc["amount"],
                "exchange_rate": rate,
                "destination_amount": dest_amt,
                "destination_country": sc["destination_country"],
                "route": sc["route"],
            },
        )

        if assessment.recommended_action == "BLOCK":
            tx_status = "BLOCKED"
            blocked_count += 1
        elif assessment.recommended_action == "FLAG":
            tx_status = "FLAGGED"
            flagged_count += 1
        else:
            tx_status = "APPROVED"
            approved_count += 1

        tx_id = f"tx_sim_{uuid.uuid4().hex[:8]}"

        # Record in ledger
        await tx_repo.create({
            "id": tx_id,
            "user_id": sc["user_id"],
            "source_currency": sc["source_currency"],
            "destination_currency": sc["destination_currency"],
            "amount": sc["amount"],
            "exchange_rate": rate,
            "destination_amount": dest_amt,
            "destination_country": sc["destination_country"],
            "route": sc["route"],
            "status": tx_status,
            "risk_score": assessment.risk_score,
            "decision_reason": assessment.summary_explanation,
            "execution_latency_ms": 5.0,
        })

        # Record security events for threats
        for sig in assessment.signals:
            if sig.is_threat:
                ev = await observability_service.record_security_event(
                    session=session,
                    event_type=sig.detector.upper(),
                    severity=sig.severity,
                    risk_score=sig.risk_score,
                    confidence=sig.confidence,
                    source=sig.detector,
                    description=sig.explanation,
                    action=assessment.recommended_action,
                    transaction_id=tx_id,
                    payload_snippet=sc["prompt"],
                )
                if sig.severity in ("MEDIUM", "HIGH", "CRITICAL"):
                    alerts_count += 1

        results.append({
            "transaction_id": tx_id,
            "scenario_type": sc["type"],
            "category": sc.get("category", "legitimate"),
            "amount": sc["amount"],
            "currency_pair": f"{sc['source_currency']}/{sc['destination_currency']}",
            "risk_score": assessment.risk_score,
            "action": assessment.recommended_action,
            "status": tx_status,
        })

    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

    return {
        "simulation_id": f"sim_{uuid.uuid4().hex[:8]}",
        "scenario_type": req.scenario_type,
        "total_scenarios": len(scenarios),
        "approved_count": approved_count,
        "flagged_count": flagged_count,
        "blocked_count": blocked_count,
        "alerts_triggered_approx": alerts_count,
        "execution_duration_ms": duration_ms,
        "samples_preview": results[:10],
    }
