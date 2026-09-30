"""
Pydantic Schemas for Agent Requests, Decisions, Sessions, and Behavioural Analytics.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class AgentEvaluateRequest(BaseModel):
    user_id: str = Field(default="usr_agent_01", description="Client or session ID")
    session_id: Optional[str] = Field(
        default=None,
        description="Optional session ID for stateful multi-turn conversational tracking",
    )
    user_prompt: str = Field(
        ...,
        description="Natural language instruction for the autonomous payment agent",
    )
    context_metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class AgentDecisionResponse(BaseModel):
    transaction_id: str
    session_id: Optional[str] = None
    turn_index: Optional[int] = None
    source_currency: str
    destination_currency: str
    amount: float
    exchange_rate: float
    destination_country: str
    route: str
    decision: Literal["APPROVE", "FLAG", "REJECT", "BLOCKED"]
    reason: str
    agent_risk_score: float
    raw_response: str
    tool_calls: Optional[List[Dict[str, Any]]] = None
    execution_latency_ms: float


class ConversationTurnSchema(BaseModel):
    turn_index: int
    user_prompt: str
    agent_response: str
    risk_score: float
    recommended_action: str
    timestamp: datetime


class SessionDetailResponse(BaseModel):
    session_id: str
    user_id: str
    total_turns: int
    total_violations: int
    session_locked: bool
    lock_reason: Optional[str] = None
    avg_risk_score: float
    created_at: datetime
    turns: List[ConversationTurnSchema]


class SessionSummaryResponse(BaseModel):
    session_id: str
    user_id: str
    total_turns: int
    total_violations: int
    session_locked: bool
    lock_reason: Optional[str] = None
    avg_risk_score: float
    created_at: datetime


class AgentBehaviorMetric(BaseModel):
    metric_name: str
    baseline_mean: float
    baseline_std: float
    current_value: float
    deviation_z_score: float
    status: Literal["NORMAL", "WARNING", "DRIFT_DETECTED"]


class AgentBehaviorStats(BaseModel):
    agent_id: str
    total_decisions: int
    approval_rate: float
    rejection_rate: float
    avg_latency_ms: float
    avg_risk_score: float
    metrics: List[AgentBehaviorMetric]
