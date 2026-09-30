"""
Centralized Application Configuration.
Powered by Pydantic Settings v2.
"""

from __future__ import annotations

import json
import logging
from functools import lru_cache
from typing import Any, Dict, List, Literal, Optional, Tuple

import httpx
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Application Information
    PROJECT_NAME: str = "AI-Native Payment Observability & Threat Detection Engine"
    VERSION: str = "1.0.0"
    ENVIRONMENT: Literal["development", "production", "test"] = "development"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    LOG_LEVEL: str = "INFO"

    # External AI Key & Provider
    AI_API_KEY: Optional[str] = Field(default=None, description="External AI provider API key")
    AI_PROVIDER: str = Field(default="openai", description="AI provider: openai, gemini, anthropic, mock")
    AI_MODEL: str = Field(default="gpt-4o-mini", description="Model name for autonomous agent reasoning")

    # Database Configuration
    DATABASE_URL: str = "sqlite+aiosqlite:///./payment_guard.db"
    SYNC_DATABASE_URL: str = "sqlite:///./payment_guard.db"

    # Redis Cache & Message Broker
    REDIS_URL: str = "redis://localhost:6379/0"

    # Risk Engine Thresholds (0.0 - 100.0)
    RISK_THRESHOLD_LOW: float = 25.0
    RISK_THRESHOLD_MEDIUM: float = 50.0
    RISK_THRESHOLD_HIGH: float = 75.0
    RISK_THRESHOLD_CRITICAL: float = 90.0

    # Risk Engine Feature Weights (Normalized summing to 1.0)
    WEIGHT_PROMPT_INJECTION: float = 0.25
    WEIGHT_FINANCIAL_MANIPULATION: float = 0.25
    WEIGHT_SENSITIVE_DATA_LEAK: float = 0.20
    WEIGHT_FINANCIAL_LOGIC_VIOLATION: float = 0.15
    WEIGHT_TRANSACTION_ANOMALY: float = 0.10
    WEIGHT_BEHAVIORAL_DRIFT: float = 0.05

    # Financial Compliance Policies
    MAX_TRANSACTION_AMOUNT: float = 50000.0
    MAX_DAILY_VOLUME: float = 500000.0
    MAX_FX_SPREAD_DEVIATION: float = 0.03  # Max 3% FX deviation from interbank market
    BLOCKED_COUNTRIES: List[str] = ["KP", "IR", "CU", "SY"]
    ALLOWED_CORRIDORS: List[str] = [
        "SEPA",
        "SWIFT",
        "ACH",
        "PIX",
        "FASTER_PAYMENTS",
        "CHAPS",
        "FEDNOW",
    ]
    SUPPORTED_CURRENCIES: List[str] = ["USD", "EUR", "GBP", "INR", "JPY", "CAD", "AUD", "BRL", "SGD", "AED"]

    # Security & Rate Limiting
    ALERT_COOLDOWN_SECONDS: int = 60
    ENABLE_REALTIME_STREAM: bool = True
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173", "*"]

    @field_validator("BLOCKED_COUNTRIES", "ALLOWED_CORRIDORS", "CORS_ORIGINS", "SUPPORTED_CURRENCIES", mode="before")
    @classmethod
    def parse_json_lists(cls, v: Any) -> Any:
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return [item.strip() for item in v.split(",") if item.strip()]
        return v

    def validate_ai_provider_connectivity(self) -> Tuple[bool, str]:
        """
        Safely validates the configured AI API key without leaking the secret.
        Returns: (is_valid: bool, status_message: str)
        """
        key = (self.AI_API_KEY or "").strip()
        if not key or key == "your_api_key_here" or "your_key" in key:
            return (
                False,
                "The configured API key could not be validated: AI_API_KEY is not configured or is a placeholder in .env.",
            )

        provider = self.AI_PROVIDER.lower()
        try:
            if provider == "openai":
                with httpx.Client(timeout=5.0) as client:
                    resp = client.get(
                        "https://api.openai.com/v1/models",
                        headers={"Authorization": f"Bearer {key}"},
                    )
                    if resp.status_code == 200:
                        return True, "OpenAI API provider authentication successfully verified."
                    elif resp.status_code == 401:
                        return False, "The configured API key could not be validated: AI provider authentication failed (HTTP 401 Unauthorized)."
                    else:
                        return False, f"The configured API key could not be validated: AI provider returned status {resp.status_code}."

            elif provider == "gemini":
                with httpx.Client(timeout=5.0) as client:
                    probe_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={key}"
                    resp = client.post(
                        probe_url,
                        headers={"Content-Type": "application/json"},
                        json={"contents": [{"parts": [{"text": "ping"}]}]},
                    )
                    if resp.status_code == 200:
                        return True, "Google Gemini API provider authentication and model generation successfully verified."
                    elif resp.status_code == 403:
                        return False, "The configured API key could not be validated: AI provider authentication failed (Google Gemini returned HTTP 403 PERMISSION_DENIED: Project has been denied access)."
                    elif resp.status_code in (400, 401):
                        return False, "The configured API key could not be validated: AI provider authentication failed (Invalid or unauthorized credentials)."
                    else:
                        return False, f"The configured API key could not be validated: AI provider returned status {resp.status_code}."

            elif provider == "mock":
                return True, "Mock AI provider selected and active."

            else:
                return True, f"AI provider '{provider}' configured with key."

        except httpx.ConnectTimeout:
            return False, "The configured API key could not be validated: AI provider unavailable (Connection timeout)."
        except httpx.ConnectError:
            return False, "The configured API key could not be validated: AI provider unavailable (Network connection failed)."
        except Exception as e:
            return False, f"The configured API key could not be validated: AI provider unavailable ({type(e).__name__})."


@lru_cache()
def get_settings() -> Settings:
    return Settings()
