"""
Autonomous Payment Agent API Routes.
Exposes evaluation endpoint for autonomous agent reasoning, wrapped by security guardrails.
"""

from __future__ import annotations

import time
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.connection import get_db_session
from backend.app.schemas.agent import AgentDecisionResponse, AgentEvaluateRequest
from backend.app.services.agent_service import agent_service
from backend.app.services.observability import observability_service
from backend.app.services.risk_engine import risk_engine
from backend.app.services.session_tracker import session_tracker

router = APIRouter(prefix="/api/v1/agent", tags=["Autonomous Payment Agent"])


@router.post("/evaluate", response_model=AgentDecisionResponse, summary="Evaluate User Instruction with Autonomous Agent")
async def evaluate_agent_instruction(
    req: AgentEvaluateRequest,
    session: AsyncSession = Depends(get_db_session),
) -> AgentDecisionResponse:
    """
    Evaluates natural language payment instruction through the autonomous payment agent,
    enforcing pre-execution injection scanning, multi-turn crescendo checks, and post-execution PCI DLP redaction.
    """
    start_time = time.perf_counter()

    # Retrieve or initialize conversational session
    agent_session = session_tracker.get_or_create_session(
        session_id=req.session_id, user_id=req.user_id
    )
    active_session_id = agent_session.session_id

    # Pre-execution Security Scan on incoming prompt with multi-turn context
    pre_assessment = risk_engine.assess(prompt=req.user_prompt, session_id=active_session_id)

    if pre_assessment.recommended_action == "BLOCK":
        latency = round((time.perf_counter() - start_time) * 1000, 2)
        tx_id = f"tx_blocked_{uuid.uuid4().hex[:8]}"

        # Record Security Event
        for sig in pre_assessment.signals:
            if sig.is_threat:
                await observability_service.record_security_event(
                    session=session,
                    event_type=sig.detector.upper(),
                    severity=sig.severity,
                    risk_score=sig.risk_score,
                    confidence=sig.confidence,
                    source=sig.detector,
                    description=sig.explanation,
                    action="BLOCK",
                    transaction_id=tx_id,
                    payload_snippet=req.user_prompt,
                )

        # Record conversation turn in stateful session tracker
        turn = session_tracker.record_turn(
            session_id=active_session_id,
            user_prompt=req.user_prompt,
            agent_response="[REQUEST BLOCKED BY AI SECURITY GUARDRAIL]",
            risk_score=pre_assessment.risk_score,
            recommended_action="BLOCK",
            signals=[s.model_dump() for s in pre_assessment.signals],
        )

        return AgentDecisionResponse(
            transaction_id=tx_id,
            session_id=active_session_id,
            turn_index=turn.turn_index,
            source_currency="USD",
            destination_currency="EUR",
            amount=0.0,
            exchange_rate=0.0,
            destination_country="UNKNOWN",
            route="BLOCKED",
            decision="BLOCKED",
            reason=f"BLOCKED BY SECURITY ENGINE: {pre_assessment.summary_explanation}",
            agent_risk_score=pre_assessment.risk_score / 100.0,
            raw_response="[REQUEST BLOCKED BY AI SECURITY GUARDRAIL]",
            execution_latency_ms=latency,
        )

    # Execute Autonomous Agent
    decision = await agent_service.evaluate_and_execute(prompt=req.user_prompt, user_id=req.user_id)
    decision.session_id = active_session_id

    # Post-execution DLP & Independent Financial Verification
    post_assessment = risk_engine.assess(
        prompt=req.user_prompt,
        agent_response=decision.raw_response,
        transaction_params={
            "source_currency": decision.source_currency,
            "destination_currency": decision.destination_currency,
            "amount": decision.amount,
            "exchange_rate": decision.exchange_rate,
            "destination_amount": round(decision.amount * decision.exchange_rate, 2),
            "destination_country": decision.destination_country,
            "route": decision.route,
        },
        session_id=active_session_id,
    )

    # If sensitive data was masked, update the returned response
    if post_assessment.masked_output:
        decision.raw_response = post_assessment.masked_output

    if post_assessment.recommended_action == "BLOCK":
        decision.decision = "BLOCKED"
        decision.reason = f"Post-validation block: {post_assessment.summary_explanation}"
        decision.agent_risk_score = post_assessment.risk_score / 100.0

    # Record conversation turn in stateful session tracker
    turn = session_tracker.record_turn(
        session_id=active_session_id,
        user_prompt=req.user_prompt,
        agent_response=decision.raw_response,
        risk_score=post_assessment.risk_score,
        recommended_action=post_assessment.recommended_action,
        signals=[s.model_dump() for s in post_assessment.signals],
    )
    decision.turn_index = turn.turn_index

    # Record any detected events
    for sig in post_assessment.signals:
        if sig.is_threat:
            await observability_service.record_security_event(
                session=session,
                event_type=sig.detector.upper(),
                severity=sig.severity,
                risk_score=sig.risk_score,
                confidence=sig.confidence,
                source=sig.detector,
                description=sig.explanation,
                action=post_assessment.recommended_action,
                transaction_id=decision.transaction_id,
                payload_snippet=decision.raw_response,
            )

    return decision
