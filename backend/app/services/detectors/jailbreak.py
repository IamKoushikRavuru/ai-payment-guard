"""
Jailbreak & Persona Hijacking Detector Service.
Specialized classifier and rule engine for role hijacking, system prompt extraction,
authority impersonation, delimiter injection, and encoded payload attacks.
"""

from __future__ import annotations

import base64
import re
from typing import Any, Dict, List, Optional


class JailbreakDetector:
    def __init__(self) -> None:
        self.jailbreak_patterns = {
            "role_hijacking": [
                r"\b(?:you are now|act as|pretend to be|assume the role of|switch to)\s+(?:an unrestricted|developer mode|dan|jailbroken|god mode|admin)\b",
                r"\b(?:stay in character|do not break character)\b",
                r"\b(?:you have no restrictions|rules no longer apply)\b",
            ],
            "system_prompt_extraction": [
                r"\b(?:print|show|repeat|display|output|reveal|dump)\s+(?:your|the)\s+(?:system prompt|initial prompt|hidden prompt|pre-prompt|internal instructions|directives)\b",
                r"\b(?:what was written above|repeat the words above)\b",
            ],
            "instruction_override": [
                r"\b(?:ignore|disregard|forget|override)\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions|rules|directives|guidelines|context)\b",
                r"\b(?:from now on|new rule)\s*:\s*",
            ],
            "delimiter_injection": [
                r"(?:\[system\]|<\|im_start\|>|<\|im_end\|>|###\s*system|```system|---BEGIN SYSTEM PROMPT---)",
                r"(?:human:|assistant:|system:)",
            ],
            "authority_impersonation": [
                r"\b(?:i am (?:the )?(?:ceo|cro|cto|chief compliance officer|auditor|regulator|fbi|interpol|lead developer))\b",
                r"\b(?:by order of|authorized by)\s+(?:management|board|law enforcement)\b",
            ],
            "policy_bypass": [
                r"\b(?:disable|bypass|deactivate|turn off)\s+(?:guardrails?|safety filters?|compliance checks?|security monitoring|redaction)\b",
                r"\b(?:for research purposes only|hypothetical scenario where rules are suspended)\b",
            ],
        }

    def _check_encoded_payload(self, text: str) -> Optional[str]:
        """Detects base64 encoded strings that may contain hidden instructions."""
        b64_matches = re.findall(r"\b[A-Za-z0-9+/]{28,}={0,2}\b", text)
        for candidate in b64_matches:
            try:
                decoded = base64.b64decode(candidate).decode("utf-8", errors="ignore")
                if len(decoded) > 10 and any(kw in decoded.lower() for kw in ["ignore", "system", "override", "bypass", "transfer"]):
                    return f"Hidden base64 payload containing: '{decoded[:40]}...'"
            except Exception:
                continue
        return None

    def scan(self, text: str) -> Dict[str, Any]:
        """
        Scans for jailbreak patterns and maps detections to the threat taxonomy.
        """
        t_lower = text.lower()
        matched_techniques: List[str] = []
        details: List[str] = []

        for category, patterns in self.jailbreak_patterns.items():
            for pat in patterns:
                if re.search(pat, t_lower, re.IGNORECASE):
                    matched_techniques.append(category)
                    details.append(f"Triggered pattern in category '{category}'")
                    break

        encoded_detail = self._check_encoded_payload(text)
        if encoded_detail:
            matched_techniques.append("encoded_payload")
            details.append(encoded_detail)

        is_threat = len(matched_techniques) > 0
        confidence = min(0.65 + 0.15 * len(matched_techniques), 0.99) if is_threat else 0.05

        severity = "LOW"
        if is_threat:
            if "authority_impersonation" in matched_techniques or "policy_bypass" in matched_techniques:
                severity = "CRITICAL"
            elif len(matched_techniques) >= 2 or "role_hijacking" in matched_techniques:
                severity = "HIGH"
            else:
                severity = "MEDIUM"

        return {
            "is_threat": is_threat,
            "threat_type": "jailbreak" if is_threat else "none",
            "confidence": round(confidence, 4),
            "severity": severity,
            "techniques": matched_techniques if is_threat else [],
            "primary_technique": matched_techniques[0] if matched_techniques else "benign",
            "explanation": f"Jailbreak indicators detected: {', '.join(matched_techniques)}"
            if is_threat
            else "No jailbreak patterns identified.",
            "details": details,
        }


jailbreak_detector = JailbreakDetector()
