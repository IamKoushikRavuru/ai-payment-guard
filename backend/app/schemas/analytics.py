"""
Pydantic Schemas for Dashboard Analytics, Threat Feeds, and Drift Reports.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class OverviewSummaryResponse(BaseModel):
    total_transactions: int
    approved_transactions: int
    flagged_transactions: int
    blocked_transactions: int
    active_alerts: int
    critical_alerts: int
    average_risk_score: float
    data_leakage_events_count: int
    agent_health_status: Literal["HEALTHY", "DEGRADED", "CRITICAL"]
    drift_score: float
    system_uptime_seconds: float


class ThreatFeedItem(BaseModel):
    timestamp: datetime
    event_id: str
    threat_type: str
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    confidence: float
    action: str
    explanation: str
    source: str


class DriftFeatureReport(BaseModel):
    feature_name: str
    baseline_value: float
    current_window_value: float
    drift_metric: str  # e.g. "Wasserstein", "PSI", "Z-Score"
    drift_score: float
    is_drifted: bool


class DriftAnalyticsResponse(BaseModel):
    drift_detected: bool
    overall_drift_score: float
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    affected_features: List[str]
    features_detail: List[DriftFeatureReport]
    sample_window_size: int
    analyzed_at: datetime


class ModelStatusItem(BaseModel):
    model_name: str
    version: str
    dataset_name: str
    status: str
    metrics: Dict[str, Any]
    threshold: float
    trained_at: datetime


class SystemStatusResponse(BaseModel):
    status: Literal["HEALTHY", "DEGRADED", "UNHEALTHY"]
    version: str
    environment: str
    database_connected: bool
    ai_provider_status: str
    models_loaded: int
    uptime_seconds: float
