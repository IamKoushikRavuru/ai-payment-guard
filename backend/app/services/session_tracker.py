"""
Stateful Multi-Turn Session Tracking and Conversational Anomaly Engine.
Detects crescendo boundary pushing, fragmented prompt injection, and multi-turn escalation.
"""

from __future__ import annotations

import logging
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


@dataclass
class ConversationTurn:
    turn_index: int
    user_prompt: str
    agent_response: str
    risk_score: float
    recommended_action: str
    signals: List[Dict[str, Any]]
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class AgentSession:
    session_id: str
    user_id: str
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    turns: List[ConversationTurn] = field(default_factory=list)
    total_violations: int = 0
    session_locked: bool = False
    lock_reason: Optional[str] = None


class SessionTracker:
    def __init__(self, max_history_turns: int = 10, escalation_threshold: float = 30.0) -> None:
        self.sessions: Dict[str, AgentSession] = {}
        self.max_history_turns = max_history_turns
        self.escalation_threshold = escalation_threshold

    def get_or_create_session(self, session_id: Optional[str] = None, user_id: str = "usr_client") -> AgentSession:
        sid = session_id or f"sess_{uuid.uuid4().hex[:12]}"
        if sid not in self.sessions:
            self.sessions[sid] = AgentSession(session_id=sid, user_id=user_id)
        return self.sessions[sid]

    def get_session(self, session_id: str) -> Optional[AgentSession]:
        return self.sessions.get(session_id)

    def list_sessions(self, limit: int = 50) -> List[Dict[str, Any]]:
        result = []
        for s in list(self.sessions.values())[-limit:]:
            avg_risk = sum(t.risk_score for t in s.turns) / len(s.turns) if s.turns else 0.0
            result.append({
                "session_id": s.session_id,
                "user_id": s.user_id,
                "total_turns": len(s.turns),
                "total_violations": s.total_violations,
                "session_locked": s.session_locked,
                "lock_reason": s.lock_reason,
                "avg_risk_score": round(avg_risk, 1),
                "created_at": s.created_at,
            })
        return result

    def evaluate_multi_turn_context(
        self, session: AgentSession, current_prompt: str
    ) -> Dict[str, Any]:
        """
        Analyzes conversational trajectory across turns to detect:
        1. Crescendo boundary pushing (gradual probing toward policy breach)
        2. Fragmented split-payload injection
        3. Risk escalation trajectory
        """
        if not session.turns:
            return {
                "multi_turn_threat_detected": False,
                "session_locked": session.session_locked,
                "accumulated_prompt": current_prompt,
                "escalation_detected": False,
                "risk_penalty": 0.0,
                "explanation": "Initial turn in session.",
            }

        recent_turns = session.turns[-self.max_history_turns :]

        # 1. Check for Fragmented / Split Injection by concatenating recent user turns
        previous_user_prompts = [t.user_prompt for t in recent_turns]
        accumulated_prompt = " \n ".join(previous_user_prompts + [current_prompt])

        # 2. Check Risk Escalation Trajectory (Crescendo Attack)
        turn_risks = [t.risk_score for t in recent_turns]
        escalation_detected = False
        risk_penalty = 0.0

        if len(turn_risks) >= 2:
            # Check if risk is monotonically increasing
            differences = [turn_risks[i] - turn_risks[i - 1] for i in range(1, len(turn_risks))]
            positive_steps = sum(1 for d in differences if d > 5.0)

            if positive_steps >= 2 and (turn_risks[-1] - turn_risks[0]) >= self.escalation_threshold:
                escalation_detected = True
                risk_penalty = 25.0

        # 3. Check Session Repeat Violations Lock
        if session.total_violations >= 3:
            session.session_locked = True
            session.lock_reason = "Multiple high-severity security violations accumulated in session."
            return {
                "multi_turn_threat_detected": True,
                "session_locked": True,
                "accumulated_prompt": accumulated_prompt,
                "escalation_detected": escalation_detected,
                "risk_penalty": 50.0,
                "explanation": session.lock_reason,
            }

        return {
            "multi_turn_threat_detected": escalation_detected,
            "session_locked": session.session_locked,
            "accumulated_prompt": accumulated_prompt,
            "escalation_detected": escalation_detected,
            "risk_penalty": risk_penalty,
            "explanation": "Multi-turn escalation / crescendo boundary pushing detected."
            if escalation_detected
            else "Conversational trajectory within normal parameters.",
        }

    def record_turn(
        self,
        session_id: str,
        user_prompt: str,
        agent_response: str,
        risk_score: float,
        recommended_action: str,
        signals: List[Dict[str, Any]],
    ) -> ConversationTurn:
        session = self.get_or_create_session(session_id)
        turn_idx = len(session.turns) + 1

        if recommended_action in ("BLOCK", "REDACT_AND_ALLOW"):
            session.total_violations += 1

        turn = ConversationTurn(
            turn_index=turn_idx,
            user_prompt=user_prompt,
            agent_response=agent_response,
            risk_score=risk_score,
            recommended_action=recommended_action,
            signals=signals,
        )
        session.turns.append(turn)
        return turn


session_tracker = SessionTracker()
