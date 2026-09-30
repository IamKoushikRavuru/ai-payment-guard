"""
Pydantic Schemas for Security Scanning, Risk Engine Signals, and Alerts.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class PromptScanRequest(BaseModel):
    prompt: str = Field(..., description="Prompt to scan for injection and jailbreak")
    user_id: Optional[str] = Field(default="usr_unknown")
    transaction_id: Optional[str] = Field(default=None)


class ResponseScanRequest(BaseModel):
    response_text: str = Field(..., description="Agent response to scan for PAN and sensitive data")
    transaction_id: Optional[str] = Field(default=None)
    agent_id: Optional[str] = Field(default="autonomous_payment_agent_v1")


class FullSecurityScanRequest(BaseModel):
    prompt: str
    proposed_transaction: Optional[Dict[str, Any]] = None
    agent_response: Optional[str] = None
    user_id: Optional[str] = "usr_client"


class RiskSignal(BaseModel):
    detector: str
    is_threat: bool
    risk_score: float = Field(..., ge=0.0, le=100.0)
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    confidence: float = Field(..., ge=0.0, le=1.0)
    technique: Optional[str] = None
    targeted_control: Optional[str] = None
    explanation: str
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class UnifiedRiskAssessment(BaseModel):
    risk_score: float = Field(..., ge=0.0, le=100.0, description="Calibrated unified risk score (0-100)")
    risk_level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    recommended_action: Literal["ALLOW", "FLAG", "BLOCK", "REDACT_AND_ALLOW"]
    signals: List[RiskSignal]
    masked_output: Optional[str] = None
    summary_explanation: str


class SecurityScanResponse(BaseModel):
    timestamp: datetime
    unified_assessment: UnifiedRiskAssessment
    security_event_ids: List[str] = Field(default_factory=list)


class SecurityEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    transaction_id: Optional[str] = None
    agent_id: str
    event_type: str
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    risk_score: float
    confidence: float
    source: str
    description: str
    action: Literal["ALLOW", "FLAG", "BLOCK", "REDACT_AND_ALLOW"]
    payload_snippet: Optional[str] = None
    created_at: datetime


class SecurityEventListResponse(BaseModel):
    total: int
    items: List[SecurityEventResponse]


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    security_event_id: str
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    title: str
    description: str
    is_resolved: bool
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    created_at: datetime


class AlertListResponse(BaseModel):
    total: int
    active_count: int
    items: List[AlertResponse]


class AlertResolveRequest(BaseModel):
    resolved_by: str
    resolution_notes: Optional[str] = None
