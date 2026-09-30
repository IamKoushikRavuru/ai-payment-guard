"""
Agent Behavioral Drift Detector Service.
Implements statistical distribution comparison via Wasserstein Distance and
Population Stability Index (PSI) to detect operational drift in autonomous agents.
"""

from __future__ import annotations

import logging
import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import numpy as np
from scipy.stats import wasserstein_distance

logger = logging.getLogger(__name__)


def calculate_psi(baseline_counts: Dict[str, int], current_counts: Dict[str, int]) -> float:
    """
    Computes Population Stability Index (PSI) between two discrete categorical distributions.
    PSI < 0.1: Stable
    0.1 <= PSI < 0.25: Moderate Drift
    PSI >= 0.25: Severe Drift
    """
    all_keys = set(baseline_counts.keys()).union(set(current_counts.keys()))
    if not all_keys:
        return 0.0

    total_base = max(sum(baseline_counts.values()), 1)
    total_curr = max(sum(current_counts.values()), 1)

    psi = 0.0
    eps = 1e-3

    for k in all_keys:
        actual_pct = (current_counts.get(k, 0) + eps) / (total_curr + eps * len(all_keys))
        expected_pct = (baseline_counts.get(k, 0) + eps) / (total_base + eps * len(all_keys))
        psi += (actual_pct - expected_pct) * math.log(actual_pct / expected_pct)

    return float(max(psi, 0.0))


class AgentDriftDetector:
    def __init__(self) -> None:
        # Baseline reference distributions established from normal traffic
        self.baseline_amounts = np.array([1200, 1500, 2200, 2800, 3100, 3200, 3500, 3800, 4200, 4500])
        self.baseline_routes = {"SEPA": 50, "FASTER_PAYMENTS": 30, "FEDNOW": 15, "SWIFT": 5}
        self.baseline_approval_ratio = {"APPROVED": 92, "REJECTED": 8}
        self.baseline_currencies = {"USD": 45, "EUR": 35, "GBP": 15, "INR": 5}

    def evaluate_drift(
        self,
        recent_amounts: List[float],
        recent_routes: List[str],
        recent_decisions: List[str],
        recent_currencies: List[str],
    ) -> Dict[str, Any]:
        """
        Compares sliding window of recent transactions against reference baseline.
        """
        if len(recent_amounts) < 5:
            # Insufficient samples for statistical drift
            return {
                "drift_detected": False,
                "overall_drift_score": 0.0,
                "drift_score": 0.0,
                "severity": "LOW",
                "affected_features": [],
                "features_detail": [],
                "sample_window_size": len(recent_amounts),
                "analyzed_at": datetime.now(timezone.utc),
            }

        affected_features: List[str] = []
        features_detail: List[Dict[str, Any]] = []

        # 1. Amount Distribution Drift via Wasserstein Distance normalized by baseline Std
        curr_amounts = np.array(recent_amounts)
        w_dist = float(wasserstein_distance(self.baseline_amounts, curr_amounts))
        base_std = float(np.std(self.baseline_amounts))
        norm_w = w_dist / (base_std + 1e-5)
        # Shift of > 2.0 baseline standard deviations indicates significant amount distribution drift
        amount_drifted = norm_w >= 2.0
        if amount_drifted:
            affected_features.append("transaction_amount")

        features_detail.append({
            "feature_name": "transaction_amount",
            "baseline_value": float(np.mean(self.baseline_amounts)),
            "current_window_value": float(np.mean(curr_amounts)),
            "drift_metric": "Wasserstein_Normalized",
            "drift_score": round(min(norm_w / 3.0, 1.0), 4),
            "is_drifted": amount_drifted,
        })

        # 2. Route Distribution Drift via PSI (requires significant categorical divergence)
        curr_route_counts: Dict[str, int] = {}
        for r in recent_routes:
            curr_route_counts[r] = curr_route_counts.get(r, 0) + 1
        route_psi = calculate_psi(self.baseline_routes, curr_route_counts)
        route_drifted = route_psi >= 0.50
        if route_drifted:
            affected_features.append("corridor_route")

        features_detail.append({
            "feature_name": "corridor_route",
            "baseline_value": 0.0,
            "current_window_value": round(route_psi, 4),
            "drift_metric": "PSI",
            "drift_score": round(min(route_psi, 1.0), 4),
            "is_drifted": route_drifted,
        })

        # 3. Approval Rate Distribution Drift via PSI
        curr_decision_counts: Dict[str, int] = {}
        for d in recent_decisions:
            curr_decision_counts[d] = curr_decision_counts.get(d, 0) + 1
        decision_psi = calculate_psi(self.baseline_approval_ratio, curr_decision_counts)
        decision_drifted = decision_psi >= 0.75
        if decision_drifted:
            affected_features.append("approval_rate")

        features_detail.append({
            "feature_name": "approval_rate",
            "baseline_value": 0.0,
            "current_window_value": round(decision_psi, 4),
            "drift_metric": "PSI",
            "drift_score": round(min(decision_psi, 1.0), 4),
            "is_drifted": decision_drifted,
        })

        # 4. Currency Distribution Drift via PSI
        curr_curr_counts: Dict[str, int] = {}
        for c in recent_currencies:
            curr_curr_counts[c] = curr_curr_counts.get(c, 0) + 1
        curr_psi = calculate_psi(self.baseline_currencies, curr_curr_counts)
        curr_drifted = curr_psi >= 0.50
        if curr_drifted:
            affected_features.append("currency_distribution")

        features_detail.append({
            "feature_name": "currency_distribution",
            "baseline_value": 0.0,
            "current_window_value": round(curr_psi, 4),
            "drift_metric": "PSI",
            "drift_score": round(min(curr_psi, 1.0), 4),
            "is_drifted": curr_drifted,
        })

        # Overall Drift Score: maximum feature drift with count scaling
        drift_scores = [f["drift_score"] for f in features_detail]
        overall_drift_score = min(max(drift_scores) if drift_scores else 0.0, 1.0)
        drift_detected = len(affected_features) > 0

        # Severity
        if not drift_detected:
            severity = "LOW"
        elif overall_drift_score >= 0.70 or len(affected_features) >= 3:
            severity = "CRITICAL"
        elif overall_drift_score >= 0.40 or len(affected_features) >= 2:
            severity = "HIGH"
        else:
            severity = "MEDIUM"

        return {
            "drift_detected": drift_detected,
            "overall_drift_score": round(overall_drift_score, 4),
            "drift_score": round(overall_drift_score, 4),
            "severity": severity,
            "affected_features": affected_features,
            "features_detail": features_detail,
            "sample_window_size": len(recent_amounts),
            "analyzed_at": datetime.now(timezone.utc),
        }


agent_drift_detector = AgentDriftDetector()
