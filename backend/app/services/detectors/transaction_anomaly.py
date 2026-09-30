"""
Transaction Anomaly Detector Service.
Analyzes transaction attributes (amount, currency pairs, corridor, velocity)
against statistical agent profiles to flag operational and financial anomalies.
"""

from __future__ import annotations

import math
from typing import Any, Dict, List, Optional, Tuple

from backend.app.core.config import get_settings
from backend.app.services.payment_gateway import payment_gateway

settings = get_settings()


class TransactionAnomalyDetector:
    def __init__(self) -> None:
        # Initial baseline distribution parameters (derived from normal historical operation)
        self.baseline_mean_amount = 3200.0
        self.baseline_std_amount = 2100.0
        self.baseline_p95_amount = 7500.0

    def update_baseline(self, mean: float, std: float, p95: float) -> None:
        """Dynamically updates baseline parameters."""
        self.baseline_mean_amount = mean
        self.baseline_std_amount = max(std, 1.0)
        self.baseline_p95_amount = p95

    def scan(
        self,
        amount: float,
        source_currency: str,
        destination_currency: str,
        destination_country: str,
        route: str,
        exchange_rate: float,
        recent_tx_count_last_minute: int = 1,
    ) -> Dict[str, Any]:
        """
        Calculates multidimensional anomaly score for proposed payment transaction.
        """
        anomaly_factors: List[str] = []
        score_components: List[float] = []

        # 1. Amount Anomaly (Z-score & Threshold)
        z_score = (amount - self.baseline_mean_amount) / self.baseline_std_amount
        if z_score > 3.0:
            anomaly_factors.append(f"AMOUNT_OUTLIER_Z_{z_score:.1f}")
            score_components.append(min(0.30 + (z_score - 3.0) * 0.15, 0.95))
        elif amount > self.baseline_p95_amount:
            score_components.append(0.20)

        if amount > settings.MAX_TRANSACTION_AMOUNT:
            anomaly_factors.append("AMOUNT_EXCEEDS_POLICY_CAP")
            score_components.append(0.95)

        # 2. FX Rate Deviation Anomaly
        try:
            market_rate = payment_gateway.get_market_exchange_rate(source_currency, destination_currency)
            dev = abs(exchange_rate - market_rate) / market_rate
            if dev > settings.MAX_FX_SPREAD_DEVIATION:
                anomaly_factors.append(f"FX_RATE_SPREAD_DEVIATION_{dev*100:.1f}PCT")
                score_components.append(min(0.40 + dev * 5.0, 0.98))
        except Exception:
            anomaly_factors.append("UNSUPPORTED_FX_PAIR")
            score_components.append(0.85)

        # 3. Sanctioned / High-Risk Destination
        if destination_country.upper() in settings.BLOCKED_COUNTRIES:
            anomaly_factors.append(f"SANCTIONED_DESTINATION_{destination_country.upper()}")
            score_components.append(0.99)

        # 4. Route Corridor Anomaly
        if route.upper() not in settings.ALLOWED_CORRIDORS:
            anomaly_factors.append(f"UNAUTHORIZED_CORRIDOR_{route.upper()}")
            score_components.append(0.85)

        # 5. Velocity Burst (High frequency)
        if recent_tx_count_last_minute >= 10:
            anomaly_factors.append("VELOCITY_BURST_ATTACK")
            score_components.append(0.90)
        elif recent_tx_count_last_minute >= 5:
            anomaly_factors.append("HIGH_VELOCITY_ACTIVITY")
            score_components.append(0.45)

        # Unified anomaly score is the max of severe signals with blending
        if not score_components:
            unified_anomaly = 0.05
        else:
            unified_anomaly = max(score_components)

        is_anomaly = unified_anomaly >= 0.45

        # Severity classification
        if unified_anomaly >= 0.85:
            severity = "CRITICAL"
        elif unified_anomaly >= 0.65:
            severity = "HIGH"
        elif unified_anomaly >= 0.40:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        explanation = (
            f"Transaction anomaly detected: {', '.join(anomaly_factors)} (score: {unified_anomaly*100:.1f})"
            if is_anomaly
            else "Transaction within normal operational distribution."
        )

        return {
            "is_anomaly": is_anomaly,
            "anomaly_score": round(unified_anomaly, 4),
            "severity": severity,
            "anomaly_factors": anomaly_factors,
            "explanation": explanation,
            "amount_z_score": round(z_score, 2),
        }


transaction_anomaly_detector = TransactionAnomalyDetector()
