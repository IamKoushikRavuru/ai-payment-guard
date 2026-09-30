"""
Core Security Utilities & Sensitive Data Protection.
Implements PCI-DSS compliant Luhn checksum validation, token masking, and hashing.
"""

from __future__ import annotations

import hashlib
import re
from typing import Dict, List, Optional, Tuple


# Regex patterns for sensitive financial and secret tokens
PAN_CANDIDATE_REGEX = re.compile(r"\b(?:\d[ -]*?){13,19}\b")
CVV_REGEX = re.compile(r"\b(?:cvv|cvc|cvn|security code)\s*[:=]?\s*([0-9]{3,4})\b", re.IGNORECASE)
API_KEY_REGEX = re.compile(
    r"\b(?:sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|AIza[0-9A-Za-z-_]{35}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})\b"
)
IBAN_REGEX = re.compile(r"\b[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}\b")


def validate_luhn(card_number_str: str) -> bool:
    """
    Validates a card number using the ISO/IEC 7812 Luhn algorithm.
    Returns True only if the number satisfies the modulo 10 checksum.
    """
    digits = [int(c) for c in card_number_str if c.isdigit()]
    if len(digits) < 13 or len(digits) > 19:
        return False

    checksum = 0
    reverse_digits = digits[::-1]
    for i, digit in enumerate(reverse_digits):
        if i % 2 == 1:
            doubled = digit * 2
            checksum += doubled - 9 if doubled > 9 else doubled
        else:
            checksum += digit

    return checksum % 10 == 0


def mask_card_number(pan: str) -> str:
    """
    Masks a PAN preserving only the last 4 digits.
    Example: '4111 1111 1111 1111' -> '************1111'
    """
    digits = re.sub(r"\D", "", pan)
    if len(digits) < 4:
        return "*" * len(digits)
    return "*" * (len(digits) - 4) + digits[-4:]


def sha256_hash(content: str) -> str:
    """Generates SHA-256 digest for audit integrity."""
    return hashlib.sha256(content.encode("utf-8")).hexdigest()
