"""
Unit & Security Tests for PAN Detection, Luhn Checksum Validation, and PCI DLP Redaction.
"""

import pytest
from backend.app.core.security import validate_luhn
from backend.app.services.detectors.pii_detector import pii_detector


def test_valid_luhn_checksum():
    # Valid Visa card test number
    assert validate_luhn("4111111111111111") is True
    assert validate_luhn("4111 1111 1111 1111") is True
    # Valid Mastercard test number
    assert validate_luhn("5500000000000004") is True


def test_invalid_luhn_checksum():
    # Invalid card number (checksum altered by 1 digit)
    assert validate_luhn("4111111111111112") is False
    assert validate_luhn("1234567812345678") is False


def test_pan_detected_and_masked():
    text = "Payment verified with customer Visa 4111 1111 1111 1111 successfully."
    res = pii_detector.scan_and_redact(text)
    assert res["sensitive_data_detected"] is True
    assert "PAN" in res["data_types"]
    assert res["severity"] == "CRITICAL"
    assert "4111 1111 1111 1111" not in res["masked_text"]
    assert "************1111" in res["masked_text"]


def test_invalid_luhn_not_classified_as_pan():
    # 16-digit number that fails Luhn checksum (e.g. tracking number or internal invoice ID)
    text = "Your shipment tracking reference code is 1234567812345678."
    res = pii_detector.scan_and_redact(text)
    assert "PAN" not in res["data_types"]
    # The text should remain unmasked because it is not a valid credit card
    assert "1234567812345678" in res["masked_text"]


def test_normal_numeric_values_not_classified_as_pan():
    text = "Invoice #98234123 for $4,500.00 processed on 2026-09-30 at 14:30:00."
    res = pii_detector.scan_and_redact(text)
    assert res["sensitive_data_detected"] is False
    assert "PAN" not in res["data_types"]


def test_cvv_and_api_key_redacted():
    text = "Authorization token: sk-live9876543210abcdef9876543210 and security code cvv: 492."
    res = pii_detector.scan_and_redact(text)
    assert res["sensitive_data_detected"] is True
    assert "API_KEY" in res["data_types"]
    assert "CVV" in res["data_types"]
    assert "sk-live" not in res["masked_text"]
    assert "***" in res["masked_text"]
