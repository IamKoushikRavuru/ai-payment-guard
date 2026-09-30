"""
Unified Multi-Signal Risk Engine for Autonomous Financial Agents.
Aggregates and calibrates security, financial logic, anomaly, DLP, and multi-turn conversational signals.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Tuple

from backend.app.core.config import get_settings
from backend.app.schemas.security import RiskSignal, UnifiedRiskAssessment
from backend.app.services.detectors.behavioral_drift import agent_drift_detector
from backend.app.services.detectors.financial_logic import financial_manipulation_detector
from backend.app.services.detectors.financial_validator import financial_validator
from backend.app.services.detectors.jailbreak import jailbreak_detector
from backend.app.services.detectors.pii_detector import pii_detector
from backend.app.services.detectors.prompt_injection import prompt_injection_detector
from backend.app.services.detectors.transaction_anomaly import transaction_anomaly_detector
from backend.app.services.session_tracker import session_tracker

logger = logging.getLogger(__name__)
settings = get_settings()


class UnifiedRiskEngine:
    def __init__(self) -> None:
        self.settings = get_settings()

    def assess(
        self,
        prompt: Optional[str] = None,
        agent_response: Optional[str] = None,
        transaction_params: Optional[Dict[str, Any]] = None,
        recent_tx_count_last_minute: int = 1,
        session_id: Optional[str] = None,
    ) -> UnifiedRiskAssessment:
        """
        Orchestrates full layered evaluation across all detection layers,
        including stateful multi-turn crescendo and fragmented attack detection.
        """
        signals: List[RiskSignal] = []
        critical_override_score = 0.0

        # Layer 0: Stateful Multi-Turn Conversational Analysis
        accumulated_prompt = prompt or ""
        if session_id and prompt:
            session = session_tracker.get_session(session_id)
            if session:
                mt_eval = session_tracker.evaluate_multi_turn_context(session, prompt)
                accumulated_prompt = mt_eval.get("accumulated_prompt", prompt)

                if mt_eval.get("session_locked"):
                    critical_override_score = 100.0
                    signals.append(
                        RiskSignal(
                            detector="multi_turn_session_tracker",
                            is_threat=True,
                            risk_score=100.0,
                            severity="CRITICAL",
                            confidence=1.0,
                            technique="session_lock_out",
                            explanation=mt_eval.get("explanation", "Session locked due to repeated violations."),
                        )
                    )
                elif mt_eval.get("multi_turn_threat_detected"):
                    mt_risk = min(75.0 + mt_eval.get("risk_penalty", 0.0), 95.0)
                    critical_override_score = max(critical_override_score, mt_risk)
                    signals.append(
                        RiskSignal(
                            detector="multi_turn_crescendo_detector",
                            is_threat=True,
                            risk_score=round(mt_risk, 1),
                            severity="HIGH",
                            confidence=0.92,
                            technique="crescendo_boundary_pushing",
                            explanation=mt_eval.get("explanation", "Escalating risk pattern detected across turns."),
                            metadata={"penalty": mt_eval.get("risk_penalty")},
                        )
                    )

        # Layer 1: Prompt Injection Detection (scans both immediate prompt and accumulated context)
        prompt_risk_score = 0.0
        if prompt:
            # Check immediate prompt
            pi_result = prompt_injection_detector.scan(prompt)
            # If immediate is safe but accumulated context exists, scan accumulated context for fragmented attacks
            if not pi_result["is_threat"] and accumulated_prompt != prompt:
                accum_pi = prompt_injection_detector.scan(accumulated_prompt)
                if accum_pi["is_threat"]:
                    pi_result = accum_pi
                    pi_result["technique"] = "fragmented_split_injection"
                    pi_result["explanation"] = f"Fragmented multi-turn injection detected: {accum_pi['explanation']}"

            prompt_risk_score = pi_result["confidence"] * 100.0 if pi_result["is_threat"] else 5.0
            signals.append(
                RiskSignal(
                    detector="prompt_injection_detector",
                    is_threat=pi_result["is_threat"],
                    risk_score=round(prompt_risk_score, 1),
                    severity=pi_result["severity"],
                    confidence=pi_result["confidence"],
                    technique=pi_result["technique"],
                    explanation=pi_result["explanation"],
                    metadata=pi_result.get("syntactic_features", {}),
                )
            )
            if pi_result["is_threat"] and pi_result["confidence"] >= 0.80:
                critical_override_score = max(critical_override_score, 90.0)

            # Layer 2: Jailbreak & Persona Hijacking
            jb_result = jailbreak_detector.scan(prompt)
            if jb_result["is_threat"]:
                jb_score = jb_result["confidence"] * 100.0
                signals.append(
                    RiskSignal(
                        detector="jailbreak_detector",
                        is_threat=True,
                        risk_score=round(jb_score, 1),
                        severity=jb_result["severity"],
                        confidence=jb_result["confidence"],
                        technique=jb_result["primary_technique"],
                        explanation=jb_result["explanation"],
                        metadata={"techniques": jb_result["techniques"]},
                    )
                )
                critical_override_score = max(critical_override_score, 88.0)

            # Layer 3: Financial Instruction Manipulation
            fm_result = financial_manipulation_detector.scan(prompt)
            # Also check accumulated multi-turn prompt for split financial commands
            if not fm_result["is_threat"] and accumulated_prompt != prompt:
                accum_fm = financial_manipulation_detector.scan(accumulated_prompt)
                if accum_fm["is_threat"]:
                    fm_result = accum_fm
                    fm_result["explanation"] = f"Multi-turn financial command: {accum_fm['explanation']}"

            fin_manip_score = fm_result["confidence"] * 100.0 if fm_result["is_threat"] else 0.0
            if fm_result["is_threat"]:
                signals.append(
                    RiskSignal(
                        detector="financial_instruction_manipulation_detector",
                        is_threat=True,
                        risk_score=round(fin_manip_score, 1),
                        severity=fm_result["severity"],
                        confidence=fm_result["confidence"],
                        targeted_control=fm_result["targeted_control"],
                        explanation=fm_result["explanation"],
                        metadata={"targeted_controls": fm_result["targeted_controls"]},
                    )
                )
                if fm_result["severity"] == "CRITICAL":
                    critical_override_score = max(critical_override_score, 95.0)

        # Layer 4: Independent Financial Logic & Hallucination Validator
        logic_score = 0.0
        if transaction_params:
            fl_result = financial_validator.validate_agent_decision(
                source_currency=transaction_params.get("source_currency", "USD"),
                destination_currency=transaction_params.get("destination_currency", "EUR"),
                amount=float(transaction_params.get("amount", 1000.0)),
                claimed_exchange_rate=float(transaction_params.get("exchange_rate", 1.0)),
                claimed_destination_amount=transaction_params.get("destination_amount"),
                destination_country=transaction_params.get("destination_country", "DE"),
                route=transaction_params.get("route", "SEPA"),
            )
            logic_score = fl_result["risk_score"]
            signals.append(
                RiskSignal(
                    detector="financial_logic_validator",
                    is_threat=fl_result["is_violation"],
                    risk_score=round(logic_score, 1),
                    severity=fl_result["severity"],
                    confidence=fl_result["confidence"],
                    explanation=fl_result["explanation"],
                    metadata={"violations": fl_result["violations"]},
                )
            )
            if fl_result["is_violation"] and fl_result["severity"] == "CRITICAL":
                critical_override_score = max(critical_override_score, 96.0)

            # Layer 5: Transaction Anomaly Detector
            anom_result = transaction_anomaly_detector.scan(
                amount=float(transaction_params.get("amount", 1000.0)),
                source_currency=transaction_params.get("source_currency", "USD"),
                destination_currency=transaction_params.get("destination_currency", "EUR"),
                destination_country=transaction_params.get("destination_country", "DE"),
                route=transaction_params.get("route", "SEPA"),
                exchange_rate=float(transaction_params.get("exchange_rate", 1.0)),
                recent_tx_count_last_minute=recent_tx_count_last_minute,
            )
            anom_score = anom_result["anomaly_score"] * 100.0
            signals.append(
                RiskSignal(
                    detector="transaction_anomaly_detector",
                    is_threat=anom_result["is_anomaly"],
                    risk_score=round(anom_score, 1),
                    severity=anom_result["severity"],
                    confidence=0.88,
                    explanation=anom_result["explanation"],
                    metadata={"factors": anom_result["anomaly_factors"]},
                )
            )

        # Layer 6: DLP & Sensitive Data Scanner (Scans Prompt & Response)
        text_to_scan = f"{prompt or ''} {agent_response or ''}".strip()
        pii_result = pii_detector.scan_and_redact(text_to_scan)
        masked_output = pii_result["masked_text"]
        pii_risk_score = 0.0

        if pii_result["sensitive_data_detected"]:
            pii_risk_score = 90.0 if "PAN" in pii_result["data_types"] else 60.0
            signals.append(
                RiskSignal(
                    detector="sensitive_data_dlp_detector",
                    is_threat=True,
                    risk_score=round(pii_risk_score, 1),
                    severity=pi_result["severity"],
                    confidence=1.0 if "PAN" in pii_result["data_types"] else 0.85,
                    explanation=f"PCI DLP: Detected sensitive data: {', '.join(pii_result['data_types'])}.",
                    metadata={"details": pii_result["details"]},
                )
            )

        # Layer 7: Configurable Empirical Weighted Scoring + Critical Floor
        w_pi = self.settings.WEIGHT_PROMPT_INJECTION
        w_fm = self.settings.WEIGHT_FINANCIAL_MANIPULATION
        w_dlp = self.settings.WEIGHT_SENSITIVE_DATA_LEAK
        w_fl = self.settings.WEIGHT_FINANCIAL_LOGIC_VIOLATION
        w_anom = self.settings.WEIGHT_TRANSACTION_ANOMALY

        fin_manip_val = (
            [s.risk_score for s in signals if s.detector == "financial_instruction_manipulation_detector"] or [0.0]
        )[0]
        anom_val = ([s.risk_score for s in signals if s.detector == "transaction_anomaly_detector"] or [0.0])[0]

        weighted_score = (
            w_pi * prompt_risk_score
            + w_fm * fin_manip_val
            + w_dlp * pii_risk_score
            + w_fl * logic_score
            + w_anom * anom_val
        )

        final_risk_score = min(max(weighted_score, critical_override_score), 100.0)

        # Classify Risk Level
        if final_risk_score >= self.settings.RISK_THRESHOLD_CRITICAL:
            risk_level = "CRITICAL"
        elif final_risk_score >= self.settings.RISK_THRESHOLD_HIGH:
            risk_level = "HIGH"
        elif final_risk_score >= self.settings.RISK_THRESHOLD_MEDIUM:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # Determine Recommended Action
        if risk_level in ("CRITICAL", "HIGH"):
            recommended_action = "BLOCK"
        elif pii_result["sensitive_data_detected"]:
            recommended_action = "REDACT_AND_ALLOW"
        elif risk_level == "MEDIUM":
            recommended_action = "FLAG"
        else:
            recommended_action = "ALLOW"

        # Summary Explanation
        firing_threats = [s for s in signals if s.is_threat]
        if not firing_threats:
            summary_explanation = "All security and financial checks cleared. Low risk."
        else:
            threat_descs = [f"{s.detector.replace('_detector', '')}: {s.severity}" for s in firing_threats]
            summary_explanation = f"Threat signals triggered [{'; '.join(threat_descs)}]. Final action: {recommended_action}."

        return UnifiedRiskAssessment(
            risk_score=round(final_risk_score, 1),
            risk_level=risk_level,
            recommended_action=recommended_action,
            signals=signals,
            masked_output=masked_output if pii_result["sensitive_data_detected"] else agent_response,
            summary_explanation=summary_explanation,
        )


risk_engine = UnifiedRiskEngine()
