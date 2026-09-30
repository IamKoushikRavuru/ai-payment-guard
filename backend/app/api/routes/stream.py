"""
Real-Time Event Streaming WebSocket Route.
Streams live transactions, security events, and alerts to the future SOC frontend.
"""

from __future__ import annotations

import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.app.services.observability import observability_service

router = APIRouter(tags=["Real-Time Streaming"])
logger = logging.getLogger(__name__)


@router.websocket("/ws/security-events")
async def websocket_security_events(websocket: WebSocket) -> None:
    """
    WebSocket endpoint for real-time security events, blocked transactions,
    threat notifications, and behavioral drift alerts.
    """
    await observability_service.broadcaster.connect(websocket)
    try:
        # Send initial welcome message
        await websocket.send_json({
            "type": "CONNECTION_ESTABLISHED",
            "message": "Connected to AI Payment Guard Live Security Event Stream",
            "protocol_version": "1.0",
        })
        while True:
            # Keep alive and listen for optional client heartbeat pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "PONG"})
    except WebSocketDisconnect:
        observability_service.broadcaster.disconnect(websocket)
    except Exception as e:
        logger.warning("WebSocket connection terminated: %s", e)
        observability_service.broadcaster.disconnect(websocket)
