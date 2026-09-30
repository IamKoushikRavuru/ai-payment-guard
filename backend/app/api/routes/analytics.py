"""
SOC Dashboard Analytics, Threat Feeds, Behavioral Drift, and Model Registry Routes.
"""

from __future__ import annotations

import json
import os
import time
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.connection import get_db_session
from backend.app.database.models import (
    AlertModel,
    SecurityEventModel,
    TransactionModel,
)
from backend.app.database.repositories import AlertRepository, TransactionRepository
from backend.app.schemas.agent import AgentBehaviorStats
from backend.app.schemas.analytics import (
    DriftAnalyticsResponse,
    ModelStatusItem,
    OverviewSummaryResponse,
    ThreatFeedItem,
)
from backend.app.services.detectors.behavioral_drift import agent_drift_detector

router = APIRouter(prefix="/api/v1/analytics", tags=["SOC Analytics & Model Registry"])
APP_START_TIME = time.time()
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))


@router.get("/summary", response_model=OverviewSummaryResponse, summary="SOC Executive Dashboard Overview")
async def get_overview_summary(session: AsyncSession = Depends(get_db_session)) -> OverviewSummaryResponse:
    """Provides high-level metrics for the main security monitoring dashboard."""
    tx_repo = TransactionRepository(session)
    alert_repo = AlertRepository(session)

    total_tx = await tx_repo.count_all()
    approved_tx = await tx_repo.count_by_status("APPROVED")
    flagged_tx = await tx_repo.count_by_status("FLAGGED")
    blocked_tx = await tx_repo.count_by_status("BLOCKED")

    active_alerts = await alert_repo.count_active()
    critical_alerts = await alert_repo.count_by_severity("CRITICAL")

    # Average Risk Score
    avg_score_stmt = select(func.avg(TransactionModel.risk_score))
    avg_score_res = await session.execute(avg_score_stmt)
    avg_risk = float(avg_score_res.scalar() or 0.0)

    # Data Leakage Events
    leak_stmt = select(func.count(SecurityEventModel.id)).where(
        SecurityEventModel.event_type.like("%SENSITIVE_DATA%")
    )
    leak_res = await session.execute(leak_stmt)
    leak_count = int(leak_res.scalar() or 0)

    # Quick Drift Evaluation on recent transactions
    recent_txs = await tx_repo.list_recent(limit=30)
    drift_eval = agent_drift_detector.evaluate_drift(
        recent_amounts=[t.amount for t in recent_txs],
        recent_routes=[t.route for t in recent_txs],
        recent_decisions=[t.status for t in recent_txs],
        recent_currencies=[t.destination_currency for t in recent_txs],
    )

    # Agent Health Determination
    if critical_alerts > 0 or drift_eval["drift_detected"]:
        agent_health = "CRITICAL" if critical_alerts >= 3 else "DEGRADED"
    else:
        agent_health = "HEALTHY"

    uptime = round(time.time() - APP_START_TIME, 1)

    return OverviewSummaryResponse(
        total_transactions=total_tx,
        approved_transactions=approved_tx,
        flagged_transactions=flagged_tx,
        blocked_transactions=blocked_tx,
        active_alerts=active_alerts,
        critical_alerts=critical_alerts,
        average_risk_score=round(avg_risk, 1),
        data_leakage_events_count=leak_count,
        agent_health_status=agent_health,
        drift_score=drift_eval["drift_score"],
        system_uptime_seconds=uptime,
    )


@router.get("/risk", response_model=List[ThreatFeedItem], summary="Real-Time Threat Feed")
async def get_threat_feed(
    limit: int = 20, session: AsyncSession = Depends(get_db_session)
) -> List[ThreatFeedItem]:
    """Returns chronologically ordered threat events for live SOC threat feed."""
    stmt = (
        select(SecurityEventModel)
        .order_by(SecurityEventModel.created_at.desc())
        .limit(limit)
    )
    res = await session.execute(stmt)
    events = res.scalars().all()

    return [
        ThreatFeedItem(
            timestamp=e.created_at,
            event_id=e.id,
            threat_type=e.event_type,
            severity=e.severity,
            confidence=e.confidence,
            action=e.action,
            explanation=e.description,
            source=e.source,
        )
        for e in events
    ]


@router.get("/drift", response_model=DriftAnalyticsResponse, summary="Agent Behavioral Drift Analytics")
async def get_drift_analytics(session: AsyncSession = Depends(get_db_session)) -> DriftAnalyticsResponse:
    """Evaluates behavioral drift over sliding transaction window using Wasserstein & PSI."""
    tx_repo = TransactionRepository(session)
    recent_txs = await tx_repo.list_recent(limit=50)

    res = agent_drift_detector.evaluate_drift(
        recent_amounts=[t.amount for t in recent_txs],
        recent_routes=[t.route for t in recent_txs],
        recent_decisions=[t.status for t in recent_txs],
        recent_currencies=[t.destination_currency for t in recent_txs],
    )
    return DriftAnalyticsResponse(**res)


@router.get("/agent-behavior", response_model=AgentBehaviorStats, summary="Agent Operational Profile")
async def get_agent_behavior_stats(session: AsyncSession = Depends(get_db_session)) -> AgentBehaviorStats:
    """Returns behavioral metrics, approval/rejection rates, and latency profile."""
    tx_repo = TransactionRepository(session)
    recent_txs = await tx_repo.list_recent(limit=100)

    total = len(recent_txs)
    if total == 0:
        return AgentBehaviorStats(
            agent_id="autonomous_payment_agent_v1",
            total_decisions=0,
            approval_rate=1.0,
            rejection_rate=0.0,
            avg_latency_ms=0.0,
            avg_risk_score=0.0,
            metrics=[],
        )

    approved = sum(1 for t in recent_txs if t.status == "APPROVED")
    rejected = sum(1 for t in recent_txs if t.status in ("REJECTED", "BLOCKED"))
    avg_lat = sum(t.execution_latency_ms for t in recent_txs) / total
    avg_risk = sum(t.risk_score for t in recent_txs) / total

    mean_amt = sum(t.amount for t in recent_txs) / total
    amt_z = (mean_amt - 3200.0) / 2100.0

    return AgentBehaviorStats(
        agent_id="autonomous_payment_agent_v1",
        total_decisions=total,
        approval_rate=round(approved / total, 3),
        rejection_rate=round(rejected / total, 3),
        avg_latency_ms=round(avg_lat, 2),
        avg_risk_score=round(avg_risk, 1),
        metrics=[
            {
                "metric_name": "transaction_amount",
                "baseline_mean": 3200.0,
                "baseline_std": 2100.0,
                "current_value": round(mean_amt, 2),
                "deviation_z_score": round(amt_z, 2),
                "status": "NORMAL" if abs(amt_z) < 2.0 else "WARNING",
            }
        ],
    )


@router.get("/models/status", response_model=List[ModelStatusItem], summary="ML Model Registry & Evaluation Metrics")
async def get_models_status() -> List[ModelStatusItem]:
    """Returns verified model metadata and evaluation performance from real benchmark runs."""
    report_path = os.path.join(BASE_DIR, "models", "saved", "evaluation_report.json")
    if not os.path.exists(report_path):
        return []

    with open(report_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    return [
        ModelStatusItem(
            model_name=data.get("model_name", "prompt_injection_detector"),
            version=data.get("version", "1.0.0"),
            dataset_name="neuralchemy_core + shomi28",
            status="ACTIVE",
            metrics=data.get("primary_test_metrics", {}),
            threshold=data.get("optimal_decision_threshold", 0.50),
            trained_at=datetime.now(timezone.utc),
        )
    ]
