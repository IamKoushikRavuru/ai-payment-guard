"""
Health Check and System Diagnostics Routes.
"""

from __future__ import annotations

import os
import time
from typing import Dict

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import get_settings
from backend.app.database.connection import get_db_session
from backend.app.schemas.analytics import SystemStatusResponse

router = APIRouter(tags=["Health & Status"])
settings = get_settings()
START_TIME = time.time()


@router.get("/health", summary="Basic health probe")
async def health_check() -> Dict[str, str]:
    """Lightweight readiness/liveness probe for load balancers and orchestrators."""
    return {"status": "ok", "service": settings.PROJECT_NAME, "version": settings.VERSION}


@router.get("/api/v1/system/status", response_model=SystemStatusResponse, summary="System diagnostics and AI status")
async def system_status(session: AsyncSession = Depends(get_db_session)) -> SystemStatusResponse:
    """Returns deep diagnostics on database connectivity, external AI provider key status, and loaded models."""
    # Check DB
    db_ok = True
    try:
        await session.execute(text("SELECT 1"))
    except Exception:
        db_ok = False

    # Check AI Provider Connectivity
    _, ai_status_message = settings.validate_ai_provider_connectivity()

    # Check ML Model Files
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
    models_dir = os.path.join(base_dir, "models", "saved")
    models_count = 0
    if os.path.exists(models_dir):
        models_count = len([f for f in os.listdir(models_dir) if f.endswith(".joblib")])

    uptime = round(time.time() - START_TIME, 1)

    overall_status = "HEALTHY" if db_ok and models_count >= 1 else "DEGRADED"

    return SystemStatusResponse(
        status=overall_status,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        database_connected=db_ok,
        ai_provider_status=ai_status_message,
        models_loaded=models_count,
        uptime_seconds=uptime,
    )
