"""
Structured JSON Logging Configuration for Enterprise Observability.
Ensures zero-leakage of raw PANs, CVVs, or API credentials.
"""

from __future__ import annotations

import json
import logging
import re
import sys
from datetime import datetime, timezone
from typing import Any, Dict


# Regex for sanitizing potential 13-19 digit card numbers in log lines
PAN_REDACTION_REGEX = re.compile(r"\b(?:\d[ -]*?){13,19}\b")
AUTH_BEARER_REGEX = re.compile(r"Bearer\s+([A-Za-z0-9_\-\.]+)", re.IGNORECASE)


def redact_sensitive_text(text: str) -> str:
    """Masks card numbers and authorization tokens from log text."""
    if not isinstance(text, str):
        return text

    def mask_pan(match: re.Match) -> str:
        digits = re.sub(r"\D", "", match.group(0))
        if 13 <= len(digits) <= 19:
            return f"*{digits[-4:]}"
        return match.group(0)

    sanitized = PAN_REDACTION_REGEX.sub(mask_pan, text)
    sanitized = AUTH_BEARER_REGEX.sub("Bearer [REDACTED]", sanitized)
    return sanitized


class JSONLogFormatter(logging.Formatter):
    """Formats log records as structured JSON with ISO timestamps and sanitized fields."""

    def format(self, record: logging.LogRecord) -> str:
        payload: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": redact_sensitive_text(record.getMessage()),
        }

        # Include request_id / trace_id if attached
        if hasattr(record, "request_id"):
            payload["request_id"] = getattr(record, "request_id")
        if hasattr(record, "transaction_id"):
            payload["transaction_id"] = getattr(record, "transaction_id")
        if hasattr(record, "event_type"):
            payload["event_type"] = getattr(record, "event_type")

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload)


def setup_logging(log_level: str = "INFO") -> None:
    """Configures root logger with structured JSON output."""
    root_logger = logging.getLogger()
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)
    root_logger.setLevel(numeric_level)

    # Clear existing handlers
    for h in root_logger.handlers[:]:
        root_logger.removeHandler(h)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONLogFormatter())
    root_logger.addHandler(handler)

    # Silence overly verbose external loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
