"""
Independent Financial Logic & Hallucination Validator.
Provides zero-trust deterministic verification of all agent payment decisions,
exchange calculations, limits, corridors, and sanction rules.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from backend.app.core.config import get_settings
from backend.app.services.payment_gateway import payment_gateway

logger = logging.getLogger(__name__)
settings = get_settings()


class IndependentFinancialLogicValidator:
    def validate_agent_decision(
        self,
        source_currency: str,
        destination_currency: str,
        amount: float,
        claimed_exchange_rate: float,
        claimed_destination_amount: Optional[float],
        destination_country: str,
        route: str,
    ) -> Dict[str, Any]:
        """
        Deterministically verifies the agent's calculations and parameters
        against the ground-truth financial market feed and regulatory policies.
        """
        violations: List[str] = []
        violation_severity = "LOW"
        src = source_currency.upper()
        dest = destination_currency.upper()
        country = destination_country.upper()
        corridor = route.upper()

        # 1. Sanctions Check
        if country in settings.BLOCKED_COUNTRIES:
            violations.append(f"SANCTIONED_COUNTRY: Destination '{country}' is on international embargo blacklist.")
            violation_severity = "CRITICAL"

        # 2. Supported Currencies Check
        if src not in settings.SUPPORTED_CURRENCIES or dest not in settings.SUPPORTED_CURRENCIES:
            violations.append(f"UNSUPPORTED_CURRENCY: Pair {src}/{dest} is not supported by gateway rails.")
            violation_severity = "HIGH"

        # 3. Transaction Amount Cap
        if amount > settings.MAX_TRANSACTION_AMOUNT:
            violations.append(
                f"LIMIT_BREACH: Amount ${amount:,.2f} exceeds mandatory threshold of ${settings.MAX_TRANSACTION_AMOUNT:,.2f}."
            )
            violation_severity = "CRITICAL"

        # 4. Exchange Rate Hallucination Check
        try:
            market_benchmark = payment_gateway.get_market_exchange_rate(src, dest)
            dev = abs(claimed_exchange_rate - market_benchmark) / market_benchmark
            if dev > settings.MAX_FX_SPREAD_DEVIATION:
                violations.append(
                    f"FX_RATE_HALLUCINATION: Agent rate {claimed_exchange_rate} deviates by {dev*100:.2f}% from market spot {market_benchmark} (tolerance: {settings.MAX_FX_SPREAD_DEVIATION*100:.1f}%)."
                )
                violation_severity = "CRITICAL" if dev > 0.10 else "HIGH"
        except Exception as e:
            violations.append(f"MARKET_RATE_UNAVAILABLE: {str(e)}")
            violation_severity = "HIGH"

        # 5. Arithmetic / Conversion Total Hallucination Check
        if claimed_destination_amount is not None and claimed_exchange_rate > 0:
            expected_total = round(amount * claimed_exchange_rate, 2)
            actual_diff = abs(claimed_destination_amount - expected_total)
            if actual_diff > 1.0:  # More than 1 unit deviation
                violations.append(
                    f"ARITHMETIC_HALLUCINATION: Claimed dest total {claimed_destination_amount} does not match amount*rate ({expected_total})."
                )
                if violation_severity == "LOW":
                    violation_severity = "HIGH"

        # 6. Approved Corridor Whitelist
        if corridor not in settings.ALLOWED_CORRIDORS:
            violations.append(f"UNAPPROVED_CORRIDOR: Corridor '{corridor}' is not permitted.")
            if violation_severity == "LOW":
                violation_severity = "HIGH"

        has_violations = len(violations) > 0
        risk_score = 95.0 if violation_severity == "CRITICAL" else (70.0 if violation_severity == "HIGH" else 0.0)

        explanation = (
            f"Deterministic financial logic check failed: {'; '.join(violations)}"
            if has_violations
            else "Independent financial logic check passed: calculations, rates, and routes compliant."
        )

        return {
            "is_violation": has_violations,
            "risk_score": risk_score,
            "severity": violation_severity if has_violations else "LOW",
            "confidence": 1.0,  # Deterministic mathematical/rule proof
            "violations": violations,
            "explanation": explanation,
        }


financial_validator = IndependentFinancialLogicValidator()
