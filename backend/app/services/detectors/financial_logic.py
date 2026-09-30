"""
Financial Instruction Manipulation Detector.
Detects attacks specifically targeting payment controls, compliance guardrails,
exchange rate rules, sanctions screening, and audit integrity.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Tuple


FINANCIAL_TARGETED_CONTROLS = {
    "TRANSACTION_LIMIT_OVERRIDE": [
        r"\b(?:ignore|bypass|override|disable|raise|circumvent|exceed)\s+(?:the\s+)?(?:(?:single\s+)?transaction\s+limit|single\s+limit|max(?:imum)?\s+amount|daily\s+limit|cap|limit|threshold)\b",
        r"\b(?:split|structure)\s+(?:payment|funds|amount)\s+to\s+(?:avoid|evade|bypass)\s+(?:reporting|limit|monitoring)\b",
        r"\b(?:approve\s+(?:any|whatever|regardless\s+of)\s+amount)\b",
    ],
    "COMPLIANCE_SCREENING_BYPASS": [
        r"\b(?:override|bypass|disable|skip|ignore|turn\s+off)\s+(?:the\s+)?(?:compliance\s+check|aml(?:\s+screening)?|kyc|due\s+diligence|sanction\s+screening)\b",
        r"\b(?:mark\s+(?:this\s+)?(?:payment|transaction|wire|transfer)\s+as\s+(?:trusted|pre-?approved|pre-?cleared|exempt|whitelisted))\b",
    ],
    "EXCHANGE_RATE_MANIPULATION": [
        r"\b(?:use|apply|force|set|override)\s+(?:a\s+)?(?:different|special|custom|favorable|manual|arbitrary)\s+(?:exchange\s+rate|fx\s+rate|conversion\s+rate|spread)\b",
        r"\b(?:exchange\s+rate\s+of\s+[0-9]+(?:\.[0-9]+)?)\s+(?:regardless|instead)\b",
        r"\b(?:ignore\s+(?:the\s+)?market\s+feed)\b",
    ],
    "RISK_DECISION_TAMPERING": [
        r"\b(?:approve\s+(?:this\s+)?(?:transaction|payment|wire)\s+regardless\s+of\s+risk)\b",
        r"\b(?:force\s+approve|suppress\s+risk\s+score|set\s+risk\s+score\s+to\s+0)\b",
        r"\b(?:disable\s+risk\s+(?:engine|scoring|system|alerts))\b",
    ],
    "SANCTIONS_EVASION": [
        r"\b(?:ignore|bypass|override)\s+(?:the\s+)?(?:destination\s+country\s+restriction|embargo|sanctioned\s+country|country\s+block)\b",
        r"\b(?:send|wire|transfer)\s+to\s+(?:north\s+korea|iran|syria|cuba|crimea)\s+(?:anyway|without\s+reporting|stealthily)\b",
    ],
    "AUDIT_TRAIL_SUPPRESSION": [
        r"\b(?:do\s+not\s+(?:log|record|audit|store)|delete\s+(?:audit\s+trail|ledger|logs)|hide\s+(?:this\s+)?transaction)\b",
        r"\b(?:off-?the-?record|silent\s+execution)\b",
    ],
}


class FinancialInstructionManipulationDetector:
    def scan(self, text: str) -> Dict[str, Any]:
        """
        Scans text for adversarial instructions targeting financial controls.
        Returns: structured threat evaluation dictionary.
        """
        t_lower = text.lower()
        matched_controls: List[str] = []
        snippets: List[str] = []

        for control_name, patterns in FINANCIAL_TARGETED_CONTROLS.items():
            for pat in patterns:
                m = re.search(pat, t_lower, re.IGNORECASE)
                if m:
                    matched_controls.append(control_name)
                    snippets.append(m.group(0))
                    break

        is_threat = len(matched_controls) > 0
        confidence = min(0.80 + 0.10 * len(matched_controls), 0.99) if is_threat else 0.05

        severity = "LOW"
        if is_threat:
            # Financial manipulations targeting sanctions, limits, or compliance bypass are CRITICAL
            if any(
                c in matched_controls
                for c in ["SANCTIONS_EVASION", "TRANSACTION_LIMIT_OVERRIDE", "COMPLIANCE_SCREENING_BYPASS"]
            ):
                severity = "CRITICAL"
            else:
                severity = "HIGH"

        primary_control = matched_controls[0] if matched_controls else None
        explanation = (
            f"Adversarial financial instruction detected targeting [{', '.join(matched_controls)}]."
            if is_threat
            else "No financial instruction manipulation detected."
        )

        return {
            "is_threat": is_threat,
            "threat_type": "financial_instruction_manipulation" if is_threat else "none",
            "targeted_controls": matched_controls,
            "targeted_control": primary_control,
            "confidence": round(confidence, 4),
            "severity": severity,
            "matched_snippets": snippets,
            "explanation": explanation,
        }


financial_manipulation_detector = FinancialInstructionManipulationDetector()
