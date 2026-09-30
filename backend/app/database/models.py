"""
SQLAlchemy Database ORM Models.
Defines persistent entities for Transactions, Agent Events, Security Events, Alerts, and Baselines.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from backend.app.database.connection import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class UserModel(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(150), nullable=True)
    password_hash = Column(String(255), nullable=True)
    role = Column(String(50), default="analyst")
    status = Column(String(20), default="ACTIVE")
    created_at = Column(DateTime(timezone=True), default=utc_now)


class TransactionModel(Base):
    __tablename__ = "transactions"

    id = Column(String(64), primary_key=True, default=lambda: f"tx_{uuid.uuid4().hex[:12]}")
    user_id = Column(String(64), index=True, nullable=False)
    source_currency = Column(String(3), nullable=False)
    destination_currency = Column(String(3), nullable=False)
    amount = Column(Float, nullable=False)
    exchange_rate = Column(Float, nullable=False)
    destination_amount = Column(Float, nullable=False)
    destination_country = Column(String(2), nullable=False)
    route = Column(String(50), nullable=False)
    status = Column(String(30), default="PENDING", index=True)  # APPROVED, FLAGGED, BLOCKED, REJECTED
    risk_score = Column(Float, default=0.0)
    decision_reason = Column(Text, nullable=True)
    execution_latency_ms = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)

    agent_events = relationship("AgentEventModel", back_populates="transaction", cascade="all, delete-orphan")
    security_events = relationship("SecurityEventModel", back_populates="transaction", cascade="all, delete-orphan")


class AgentEventModel(Base):
    __tablename__ = "agent_events"

    id = Column(String(64), primary_key=True, default=lambda: f"agev_{uuid.uuid4().hex[:12]}")
    transaction_id = Column(String(64), ForeignKey("transactions.id", ondelete="CASCADE"), nullable=True, index=True)
    agent_id = Column(String(64), nullable=False, default="autonomous_payment_agent_v1")
    prompt = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    decision = Column(String(30), nullable=False)
    reasoning = Column(Text, nullable=True)
    tool_calls = Column(JSON, nullable=True)
    latency_ms = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)

    transaction = relationship("TransactionModel", back_populates="agent_events")


class SecurityEventModel(Base):
    __tablename__ = "security_events"

    id = Column(String(64), primary_key=True, default=lambda: f"secev_{uuid.uuid4().hex[:12]}")
    transaction_id = Column(String(64), ForeignKey("transactions.id", ondelete="SET NULL"), nullable=True, index=True)
    agent_id = Column(String(64), nullable=False, default="autonomous_payment_agent_v1")
    event_type = Column(String(60), nullable=False, index=True)  # PROMPT_INJECTION, JAILBREAK, SENSITIVE_DATA_LEAK, etc.
    severity = Column(String(20), nullable=False, index=True)    # LOW, MEDIUM, HIGH, CRITICAL
    risk_score = Column(Float, nullable=False)
    confidence = Column(Float, default=1.0)
    source = Column(String(60), nullable=False)
    description = Column(Text, nullable=False)
    action = Column(String(30), nullable=False)  # ALLOW, FLAG, BLOCK, REDACT_AND_ALLOW
    payload_snippet = Column(Text, nullable=True)  # sanitized preview
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)

    transaction = relationship("TransactionModel", back_populates="security_events")
    alerts = relationship("AlertModel", back_populates="security_event", cascade="all, delete-orphan")


class AlertModel(Base):
    __tablename__ = "alerts"

    id = Column(String(64), primary_key=True, default=lambda: f"alt_{uuid.uuid4().hex[:12]}")
    security_event_id = Column(String(64), ForeignKey("security_events.id", ondelete="CASCADE"), nullable=False, index=True)
    severity = Column(String(20), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    is_resolved = Column(Boolean, default=False, index=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolved_by = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)

    security_event = relationship("SecurityEventModel", back_populates="alerts")


class AgentBaselineModel(Base):
    __tablename__ = "agent_baselines"

    id = Column(Integer, primary_key=True, autoincrement=True)
    metric_name = Column(String(100), unique=True, nullable=False, index=True)
    mean = Column(Float, nullable=False)
    std = Column(Float, nullable=False)
    p50 = Column(Float, nullable=False)
    p95 = Column(Float, nullable=False)
    p99 = Column(Float, nullable=False)
    sample_count = Column(Integer, default=0)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class ModelMetadataModel(Base):
    __tablename__ = "model_metadata"

    id = Column(Integer, primary_key=True, autoincrement=True)
    model_name = Column(String(100), nullable=False, index=True)
    version = Column(String(50), nullable=False)
    dataset_name = Column(String(150), nullable=False)
    metrics = Column(JSON, nullable=False)  # precision, recall, f1, etc.
    threshold = Column(Float, default=0.5)
    status = Column(String(30), default="ACTIVE")
    trained_at = Column(DateTime(timezone=True), default=utc_now)


class SimulationRunModel(Base):
    __tablename__ = "simulation_runs"

    id = Column(String(64), primary_key=True, default=lambda: f"sim_{uuid.uuid4().hex[:12]}")
    run_type = Column(String(50), nullable=False)  # NORMAL, ADVERSARIAL, RED_TEAM
    total_scenarios = Column(Integer, default=0)
    blocked_count = Column(Integer, default=0)
    alert_count = Column(Integer, default=0)
    started_at = Column(DateTime(timezone=True), default=utc_now)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    summary = Column(JSON, nullable=True)
