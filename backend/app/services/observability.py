"""
Observability, Security Event Bus, and Alert Generation Engine.
Features alert deduplication/cooldown, structured persistence, and real-time streaming.
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set

from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import get_settings
from backend.app.core.logging import redact_sensitive_text
from backend.app.database.models import AlertModel, SecurityEventModel

logger = logging.getLogger(__name__)
settings = get_settings()


class AlertCooldownManager:
    """Manages cooldown and deduplication windows to prevent alert flooding in SOC."""

    def __init__(self, cooldown_seconds: int = 60) -> None:
        self.cooldown_seconds = cooldown_seconds
        self.recent_alerts: Dict[str, float] = {}

    def should_trigger(self, key: str) -> bool:
        now = time.time()
        last_time = self.recent_alerts.get(key, 0.0)
        if now - last_time >= self.cooldown_seconds:
            self.recent_alerts[key] = now
            return True
        return False


class EventBroadcaster:
    """Broadcaster for WebSockets and real-time frontend streaming."""

    def __init__(self) -> None:
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info("WebSocket client connected. Total active: %d", len(self.active_connections))

    def disconnect(self, websocket: WebSocket) -> None:
        self.active_connections.discard(websocket)
        logger.info("WebSocket client disconnected. Total active: %d", len(self.active_connections))

    async def broadcast(self, message: Dict[str, Any]) -> None:
        if not self.active_connections:
            return

        dead_connections: Set[WebSocket] = set()
        msg_json = json.dumps(message, default=str)

        for conn in self.active_connections:
            try:
                await conn.send_text(msg_json)
            except Exception:
                dead_connections.add(conn)

        for dead in dead_connections:
            self.active_connections.discard(dead)


class ObservabilityService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.broadcaster = EventBroadcaster()
        self.cooldown_mgr = AlertCooldownManager(cooldown_seconds=self.settings.ALERT_COOLDOWN_SECONDS)

    async def record_security_event(
        self,
        session: AsyncSession,
        event_type: str,
        severity: str,
        risk_score: float,
        confidence: float,
        source: str,
        description: str,
        action: str,
        transaction_id: Optional[str] = None,
        agent_id: str = "autonomous_payment_agent_v1",
        payload_snippet: Optional[str] = None,
    ) -> SecurityEventModel:
        """
        Creates and persists a SecurityEvent, evaluates alert triggers, and broadcasts over WebSocket.
        """
        event_id = f"secev_{uuid.uuid4().hex[:12]}"
        safe_snippet = redact_sensitive_text(payload_snippet or "")[:200]

        event = SecurityEventModel(
            id=event_id,
            transaction_id=transaction_id,
            agent_id=agent_id,
            event_type=event_type,
            severity=severity.upper(),
            risk_score=float(risk_score),
            confidence=float(confidence),
            source=source,
            description=description,
            action=action,
            payload_snippet=safe_snippet,
            created_at=datetime.now(timezone.utc),
        )
        session.add(event)
        await session.flush()

        # Check if an alert should be created (MEDIUM, HIGH, CRITICAL)
        alert_created = None
        if severity.upper() in ("MEDIUM", "HIGH", "CRITICAL"):
            dedup_key = f"{event_type}_{transaction_id or 'global'}_{severity.upper()}"
            if self.cooldown_mgr.should_trigger(dedup_key):
                alert_id = f"alt_{uuid.uuid4().hex[:12]}"
                alert = AlertModel(
                    id=alert_id,
                    security_event_id=event.id,
                    severity=severity.upper(),
                    title=f"Security Alert: {event_type.replace('_', ' ').title()}",
                    description=description,
                    is_resolved=False,
                    created_at=datetime.now(timezone.utc),
                )
                session.add(alert)
                alert_created = alert_id

        await session.commit()
        await session.refresh(event)

        # Broadcast live event over WebSocket
        event_payload = {
            "type": "SECURITY_EVENT",
            "event_id": event.id,
            "timestamp": event.created_at.isoformat(),
            "transaction_id": event.transaction_id,
            "event_type": event.event_type,
            "severity": event.severity,
            "risk_score": event.risk_score,
            "confidence": event.confidence,
            "source": event.source,
            "description": event.description,
            "action": event.action,
            "alert_id": alert_created,
        }
        await self.broadcaster.broadcast(event_payload)

        return event


observability_service = ObservabilityService()
