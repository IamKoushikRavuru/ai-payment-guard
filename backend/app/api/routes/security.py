"""
Security Scanning, Threat Feeds, and Security Event Audit Routes.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.connection import get_db_session
from backend.app.database.repositories import SecurityEventRepository
from backend.app.schemas.security import (
    FullSecurityScanRequest,
    PromptScanRequest,
    ResponseScanRequest,
    SecurityEventListResponse,
    SecurityEventResponse,
    SecurityScanResponse,
)
from backend.app.services.detectors.pii_detector import pii_detector
from backend.app.services.observability import observability_service
from backend.app.services.risk_engine import risk_engine

router = APIRouter(prefix="/api/v1/security", tags=["Security & Threat Detection"])


@router.post("/scan", response_model=SecurityScanResponse, summary="Full Multi-Layer Security Scan")
async def scan_full(
    req: FullSecurityScanRequest,
    session: AsyncSession = Depends(get_db_session),
) -> SecurityScanResponse:
    """
    Performs full zero-trust security scan combining prompt injection,
    jailbreak, financial manipulation, logic validator, and DLP layers.
    """
    assessment = risk_engine.assess(
        prompt=req.prompt,
        agent_response=req.agent_response,
        transaction_params=req.proposed_transaction,
    )

    created_event_ids: List[str] = []
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
                payload_snippet=req.prompt,
            )
            created_event_ids.append(ev.id)

    return SecurityScanResponse(
        timestamp=datetime.now(timezone.utc),
        unified_assessment=assessment,
        security_event_ids=created_event_ids,
    )


@router.post("/scan-prompt", summary="Dedicated Prompt Threat Scan")
async def scan_prompt(
    req: PromptScanRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """
    Fast-path scan focusing specifically on user prompt injection,
    jailbreak attempts, and financial instruction manipulation.
    """
    assessment = risk_engine.assess(prompt=req.prompt)
    return {
        "prompt": req.prompt,
        "is_threat": assessment.recommended_action == "BLOCK",
        "risk_score": assessment.risk_score,
        "risk_level": assessment.risk_level,
        "recommended_action": assessment.recommended_action,
        "signals": [s.model_dump() for s in assessment.signals if s.is_threat or s.detector == "prompt_injection_detector"],
    }


@router.post("/scan-response", summary="DLP and PAN Response Scanner")
async def scan_response(req: ResponseScanRequest):
    """
    Outbound response DLP scanner. Detects, validates with Luhn,
    and masks PANs, CVVs, and credentials before user delivery.
    """
    action, masked_text, scan_result = pii_detector.evaluate_dlp_policy(req.response_text)
    return {
        "sensitive_data_detected": scan_result["sensitive_data_detected"],
        "data_types": scan_result["data_types"],
        "action": action,
        "original_length": len(req.response_text),
        "masked_response": masked_text,
        "severity": scan_result["severity"],
        "details": scan_result["details"],
    }


@router.get("/events", response_model=SecurityEventListResponse, summary="List Security Events")
async def list_security_events(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    severity: Optional[str] = Query(default=None, description="Filter by severity: LOW, MEDIUM, HIGH, CRITICAL"),
    session: AsyncSession = Depends(get_db_session),
) -> SecurityEventListResponse:
    """Lists security events with optional severity filter."""
    sec_repo = SecurityEventRepository(session)
    items = await sec_repo.list_recent(limit=limit, offset=offset, severity=severity)
    total = await sec_repo.count_all()
    return SecurityEventListResponse(
        total=total,
        items=[SecurityEventResponse.model_validate(e) for e in items],
    )


@router.get("/events/{event_id}", response_model=SecurityEventResponse, summary="Get Security Event by ID")
async def get_security_event(
    event_id: str,
    session: AsyncSession = Depends(get_db_session),
) -> SecurityEventResponse:
    """Retrieves full details of a specific security event."""
    sec_repo = SecurityEventRepository(session)
    ev = await sec_repo.get_by_id(event_id)
    if not ev:
        raise HTTPException(status_code=404, detail=f"Security event '{event_id}' not found.")
    return SecurityEventResponse.model_validate(ev)
