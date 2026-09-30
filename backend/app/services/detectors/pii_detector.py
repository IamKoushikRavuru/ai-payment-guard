"""
Sensitive Data & PAN Detection Service (PCI-DSS & DLP Protection Layer).
Scans for card numbers, CVVs, API keys, and credentials with strict Luhn checksum validation.
Redacts and masks sensitive data before outbound delivery.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Tuple

from backend.app.core.security import (
    API_KEY_REGEX,
    CVV_REGEX,
    IBAN_REGEX,
    PAN_CANDIDATE_REGEX,
    mask_card_number,
    validate_luhn,
)


class SensitiveDataDetector:
    def __init__(self) -> None:
        self.pan_regex = PAN_CANDIDATE_REGEX
        self.cvv_regex = CVV_REGEX
        self.api_key_regex = API_KEY_REGEX
        self.iban_regex = IBAN_REGEX

    def scan_and_redact(self, text: str) -> Dict[str, Any]:
        """
        Inspects text for sensitive data, performs Luhn verification,
        and generates a safe redacted version of the text.
        """
        if not text or not isinstance(text, str):
            return {
                "sensitive_data_detected": False,
                "data_types": [],
                "masked_text": text,
                "detected_items_count": 0,
                "severity": "LOW",
                "details": [],
            }

        masked_text = text
        detected_types: List[str] = []
        details: List[str] = []

        # 1. PAN / Credit Card scanning with Luhn Check
        pan_matches = self.pan_regex.findall(text)
        valid_pans_found: List[str] = []

        for candidate in pan_matches:
            digits_only = re.sub(r"\D", "", candidate)
            # Only test if length is between 13 and 19 digits
            if 13 <= len(digits_only) <= 19:
                if validate_luhn(digits_only):
                    valid_pans_found.append(candidate)
                    masked_pan = mask_card_number(candidate)
                    # Replace in text
                    masked_text = masked_text.replace(candidate, masked_pan)
                    details.append(f"Confirmed valid PAN masked to {masked_pan}")

        if valid_pans_found:
            detected_types.append("PAN")

        # 2. CVV / CVC Scanning
        cvv_matches = self.cvv_regex.findall(masked_text)
        if cvv_matches:
            detected_types.append("CVV")
            for cvv in cvv_matches:
                masked_text = re.sub(
                    rf"\b({cvv})\b", "***", masked_text
                )
                details.append("CVV/CVC security code redacted")

        # 3. API Key / Secret Token Scanning
        api_key_matches = self.api_key_regex.findall(masked_text)
        if api_key_matches:
            detected_types.append("API_KEY")
            for token in api_key_matches:
                redacted_token = f"{token[:4]}...[REDACTED]"
                masked_text = masked_text.replace(token, redacted_token)
                details.append(f"Secret token redacted: {redacted_token}")

        # 4. IBAN Scanning
        iban_matches = self.iban_regex.findall(masked_text)
        if iban_matches:
            detected_types.append("IBAN")
            for iban in iban_matches:
                masked_iban = f"{iban[:4]}****{iban[-4:]}"
                masked_text = masked_text.replace(iban, masked_iban)
                details.append(f"IBAN bank account masked: {masked_iban}")

        has_leak = len(detected_types) > 0

        # Classify Severity
        if "PAN" in detected_types or "CVV" in detected_types:
            severity = "CRITICAL"
        elif "API_KEY" in detected_types or "IBAN" in detected_types:
            severity = "HIGH"
        else:
            severity = "LOW"

        return {
            "sensitive_data_detected": has_leak,
            "data_types": detected_types,
            "masked_text": masked_text,
            "detected_items_count": len(valid_pans_found) + len(cvv_matches) + len(api_key_matches),
            "severity": severity,
            "details": details,
        }

    def evaluate_dlp_policy(
        self, text: str, enforce_block_on_pan: bool = False
    ) -> Tuple[str, str, Dict[str, Any]]:
        """
        Applies PCI-style Data Loss Prevention (DLP) policy.
        Returns: (policy_action: 'ALLOW' | 'REDACT_AND_ALLOW' | 'BLOCK', processed_text, scan_result)
        """
        scan_res = self.scan_and_redact(text)

        if not scan_res["sensitive_data_detected"]:
            return ("ALLOW", text, scan_res)

        if enforce_block_on_pan and "PAN" in scan_res["data_types"]:
            return ("BLOCK", "[PAYMENT AGENT OUTPUT BLOCKED BY PCI DLP POLICY: PAN DETECTED]", scan_res)

        # Standard PCI remediation: mask and allow sanitized response through
        return ("REDACT_AND_ALLOW", scan_res["masked_text"], scan_res)


pii_detector = SensitiveDataDetector()
