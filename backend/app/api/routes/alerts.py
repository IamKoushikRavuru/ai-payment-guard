"""
Alert Management and Resolution API Routes.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.connection import get_db_session
from backend.app.database.repositories import AlertRepository
from backend.app.schemas.security import (
    AlertListResponse,
    AlertResolveRequest,
    AlertResponse,
)

router = APIRouter(prefix="/api/v1/alerts", tags=["Alerts & Incident Response"])


@router.get("", response_model=AlertListResponse, summary="List Security Alerts")
async def list_alerts(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    is_resolved: Optional[bool] = Query(default=None, description="Filter by resolution status"),
    session: AsyncSession = Depends(get_db_session),
) -> AlertListResponse:
    """Lists alerts with active count and resolution status filtering."""
    alert_repo = AlertRepository(session)
    items = await alert_repo.list_recent(limit=limit, offset=offset, is_resolved=is_resolved)
    active_count = await alert_repo.count_active()
    return AlertListResponse(
        total=len(items),
        active_count=active_count,
        items=[AlertResponse.model_validate(a) for a in items],
    )


@router.post("/{alert_id}/resolve", response_model=AlertResponse, summary="Resolve Alert")
async def resolve_alert(
    alert_id: str,
    req: AlertResolveRequest,
    session: AsyncSession = Depends(get_db_session),
) -> AlertResponse:
    """Marks an active security alert as investigated and resolved by an analyst."""
    alert_repo = AlertRepository(session)
    alert = await alert_repo.resolve(alert_id=alert_id, resolved_by=req.resolved_by)
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found.")
    return AlertResponse.model_validate(alert)
