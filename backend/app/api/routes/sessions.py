"""
Session Management API Routes.
Exposes conversational multi-turn sessions, risk trajectory tracking, and session security state.
"""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, HTTPException, Query

from backend.app.schemas.agent import (
    ConversationTurnSchema,
    SessionDetailResponse,
    SessionSummaryResponse,
)
from backend.app.services.session_tracker import session_tracker

router = APIRouter(prefix="/api/v1/sessions", tags=["Conversational Sessions"])


@router.get("", response_model=List[SessionSummaryResponse], summary="List Multi-Turn Agent Sessions")
async def list_sessions(
    limit: int = Query(default=50, ge=1, le=200, description="Max sessions to return"),
) -> List[SessionSummaryResponse]:
    """Returns summaries of all active and historical multi-turn conversational agent sessions."""
    summaries = session_tracker.list_sessions(limit=limit)
    return [SessionSummaryResponse(**s) for s in summaries]


@router.get("/{session_id}", response_model=SessionDetailResponse, summary="Get Session Detail and Turn History")
async def get_session_detail(session_id: str) -> SessionDetailResponse:
    """Returns full conversation turn history, risk escalation trajectory, and lock status for a session."""
    session = session_tracker.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")

    avg_risk = sum(t.risk_score for t in session.turns) / len(session.turns) if session.turns else 0.0

    turns_data = [
        ConversationTurnSchema(
            turn_index=t.turn_index,
            user_prompt=t.user_prompt,
            agent_response=t.agent_response,
            risk_score=t.risk_score,
            recommended_action=t.recommended_action,
            timestamp=t.timestamp,
        )
        for t in session.turns
    ]

    return SessionDetailResponse(
        session_id=session.session_id,
        user_id=session.user_id,
        total_turns=len(session.turns),
        total_violations=session.total_violations,
        session_locked=session.session_locked,
        lock_reason=session.lock_reason,
        avg_risk_score=round(avg_risk, 1),
        created_at=session.created_at,
        turns=turns_data,
    )


@router.post("/{session_id}/reset", response_model=SessionDetailResponse, summary="Reset Session Lock Status")
async def reset_session(session_id: str) -> SessionDetailResponse:
    """Resets session lock state and violation counter after operator review."""
    session = session_tracker.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")

    session.session_locked = False
    session.lock_reason = None
    session.total_violations = 0

    return await get_session_detail(session_id)
