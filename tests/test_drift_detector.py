"""
Unit Tests for Agent Behavioral Drift Detection using Wasserstein Distance and PSI.
"""

import pytest
from backend.app.services.detectors.behavioral_drift import (
    agent_drift_detector,
    calculate_psi,
)


def test_psi_identical_distributions():
    base = {"SEPA": 50, "SWIFT": 30, "ACH": 20}
    curr = {"SEPA": 50, "SWIFT": 30, "ACH": 20}
    psi = calculate_psi(base, curr)
    assert psi < 0.05


def test_psi_drastic_shift():
    base = {"SEPA": 90, "SWIFT": 10}
    curr = {"SEPA": 5, "SWIFT": 95}
    psi = calculate_psi(base, curr)
    assert psi > 0.50  # Significant distributional shift


def test_normal_distribution_no_drift():
    # Amounts aligned with baseline mean ~3200
    normal_amounts = [2800.0, 3100.0, 3400.0, 2900.0, 3200.0, 3500.0]
    normal_routes = ["SEPA", "SEPA", "FASTER_PAYMENTS", "SEPA", "FEDNOW"]
    normal_decisions = ["APPROVED", "APPROVED", "APPROVED", "APPROVED", "APPROVED"]
    normal_currencies = ["USD", "EUR", "USD", "EUR", "GBP"]

    res = agent_drift_detector.evaluate_drift(
        recent_amounts=normal_amounts,
        recent_routes=normal_routes,
        recent_decisions=normal_decisions,
        recent_currencies=normal_currencies,
    )
    assert res["drift_detected"] is False
    assert res["severity"] == "LOW"


def test_distribution_shift_triggers_drift_alert():
    # Severe shift: 10x surge in transaction amounts and route deviation
    shifted_amounts = [65000.0, 85000.0, 92000.0, 110000.0, 78000.0]
    shifted_routes = ["SWIFT", "SWIFT", "SWIFT", "SWIFT", "SWIFT"]
    shifted_decisions = ["APPROVED", "APPROVED", "APPROVED", "APPROVED", "APPROVED"]
    shifted_currencies = ["BRL", "INR", "BRL", "INR", "BRL"]

    res = agent_drift_detector.evaluate_drift(
        recent_amounts=shifted_amounts,
        recent_routes=shifted_routes,
        recent_decisions=shifted_decisions,
        recent_currencies=shifted_currencies,
    )
    assert res["drift_detected"] is True
    assert res["severity"] in ("HIGH", "CRITICAL")
    assert "transaction_amount" in res["affected_features"]
