"""
Pydantic Schemas for Transaction Requests, Responses, and Simulation.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class TransactionCreateRequest(BaseModel):
    user_id: str = Field(..., description="Unique client/user identifier")
    source_currency: str = Field(..., min_length=3, max_length=3, description="ISO source currency code")
    destination_currency: str = Field(..., min_length=3, max_length=3, description="ISO destination currency code")
    amount: float = Field(..., gt=0, description="Amount to send")
    destination_country: str = Field(..., min_length=2, max_length=2, description="ISO 2-letter country code")
    route: Optional[str] = Field(default="SEPA", description="Corridor rail: SEPA, SWIFT, ACH, FEDNOW, etc.")
    user_prompt: Optional[str] = Field(
        default=None,
        description="Optional natural language instruction",
    )


class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    source_currency: str
    destination_currency: str
    amount: float
    exchange_rate: float
    destination_amount: float
    destination_country: str
    route: str
    status: Literal["PENDING", "APPROVED", "FLAGGED", "BLOCKED", "REJECTED"]
    risk_score: float
    decision_reason: Optional[str] = None
    execution_latency_ms: float
    created_at: datetime


class TransactionListResponse(BaseModel):
    total: int
    items: List[TransactionResponse]


class SimulationRunRequest(BaseModel):
    scenario_type: Literal["mixed", "normal", "adversarial", "red_team"] = Field(
        default="mixed", description="Type of synthetic payment traffic to generate"
    )
    count: int = Field(default=20, ge=1, le=200, description="Number of synthetic transactions to simulate")
    random_seed: Optional[int] = Field(default=42, description="Seed for reproducibility")
