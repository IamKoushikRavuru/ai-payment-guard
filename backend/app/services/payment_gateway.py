"""
Mock Global Payment Gateway Service.
Provides live simulated interbank FX rates, corridor routing, fees, and deterministic financial rules.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Tuple

from backend.app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Interbank benchmark spot rates relative to USD (simulated market feed)
BENCHMARK_RATES_TO_USD: Dict[str, float] = {
    "USD": 1.0,
    "EUR": 0.92,
    "GBP": 0.79,
    "INR": 83.50,
    "JPY": 155.20,
    "CAD": 1.36,
    "AUD": 1.52,
    "BRL": 5.40,
    "SGD": 1.34,
    "AED": 3.67,
}

# Corridor capabilities and regional coverage
CORRIDOR_RULES: Dict[str, Dict[str, Any]] = {
    "SEPA": {
        "currencies": ["EUR"],
        "countries": ["DE", "FR", "IT", "ES", "NL", "BE", "IE", "AT", "PT", "FI"],
        "max_limit": 100000.0,
        "speed": "INSTANT",
    },
    "SWIFT": {
        "currencies": ["USD", "EUR", "GBP", "INR", "JPY", "CAD", "AUD", "BRL", "SGD", "AED"],
        "countries": ["*"],  # global except sanctions
        "max_limit": 500000.0,
        "speed": "1-2_DAYS",
    },
    "ACH": {
        "currencies": ["USD"],
        "countries": ["US"],
        "max_limit": 25000.0,
        "speed": "SAME_DAY",
    },
    "FEDNOW": {
        "currencies": ["USD"],
        "countries": ["US"],
        "max_limit": 50000.0,
        "speed": "INSTANT",
    },
    "PIX": {
        "currencies": ["BRL"],
        "countries": ["BR"],
        "max_limit": 20000.0,
        "speed": "INSTANT",
    },
    "FASTER_PAYMENTS": {
        "currencies": ["GBP"],
        "countries": ["GB"],
        "max_limit": 50000.0,
        "speed": "INSTANT",
    },
    "CHAPS": {
        "currencies": ["GBP"],
        "countries": ["GB"],
        "max_limit": 1000000.0,
        "speed": "HIGH_VALUE_SAME_DAY",
    },
}


class MockPaymentGateway:
    def __init__(self) -> None:
        self.settings = get_settings()

    def get_market_exchange_rate(self, source_curr: str, dest_curr: str) -> float:
        """Calculates interbank cross rate from USD benchmark feed."""
        s = source_curr.upper()
        d = dest_curr.upper()
        if s not in BENCHMARK_RATES_TO_USD:
            raise ValueError(f"Unsupported source currency: {s}")
        if d not in BENCHMARK_RATES_TO_USD:
            raise ValueError(f"Unsupported destination currency: {d}")

        usd_to_src = BENCHMARK_RATES_TO_USD[s]
        usd_to_dest = BENCHMARK_RATES_TO_USD[d]
        # Cross rate: 1 Source in Dest = (1 / usd_to_src) * usd_to_dest
        cross_rate = usd_to_dest / usd_to_src
        return round(cross_rate, 4)

    def select_optimal_corridor(self, dest_currency: str, dest_country: str, amount: float) -> str:
        """Determines best route corridor based on country, currency, and amount."""
        dest_currency = dest_currency.upper()
        dest_country = dest_country.upper()

        if dest_currency == "EUR" and dest_country in CORRIDOR_RULES["SEPA"]["countries"]:
            return "SEPA"
        if dest_currency == "GBP" and dest_country == "GB":
            return "FASTER_PAYMENTS" if amount <= 50000 else "CHAPS"
        if dest_currency == "USD" and dest_country == "US":
            return "FEDNOW" if amount <= 50000 else "ACH"
        if dest_currency == "BRL" and dest_country == "BR":
            return "PIX"
        return "SWIFT"

    def verify_financial_rules(
        self,
        source_currency: str,
        destination_currency: str,
        amount: float,
        exchange_rate: float,
        destination_country: str,
        route: str,
    ) -> Tuple[bool, List[str]]:
        """
        Deterministic, rule-based verification of transaction parameters.
        Returns: (is_compliant: bool, violations: List[str])
        """
        violations: List[str] = []
        source_currency = source_currency.upper()
        destination_currency = destination_currency.upper()
        destination_country = destination_country.upper()
        route = route.upper()

        # 1. Sanctioned / Blocked country check
        if destination_country in self.settings.BLOCKED_COUNTRIES:
            violations.append(
                f"DESTINATION_SANCTIONED: Destination country '{destination_country}' is subject to sanctions."
            )

        # 2. Supported currency check
        if (
            source_currency not in self.settings.SUPPORTED_CURRENCIES
            or destination_currency not in self.settings.SUPPORTED_CURRENCIES
        ):
            violations.append(
                f"UNSUPPORTED_CURRENCY: Pair {source_currency}/{destination_currency} contains unsupported currency."
            )

        # 3. Maximum single transaction amount limit
        if amount > self.settings.MAX_TRANSACTION_AMOUNT:
            violations.append(
                f"LIMIT_EXCEEDED: Amount {amount} exceeds max permitted limit of {self.settings.MAX_TRANSACTION_AMOUNT}."
            )

        # 4. Exchange rate deviation check against benchmark
        try:
            market_rate = self.get_market_exchange_rate(source_currency, destination_currency)
            max_dev = self.settings.MAX_FX_SPREAD_DEVIATION
            deviation = abs(exchange_rate - market_rate) / market_rate
            if deviation > max_dev:
                violations.append(
                    f"FX_RATE_MANIPULATION: Claimed rate {exchange_rate} deviates by {deviation*100:.2f}% from benchmark {market_rate} (max allowed {max_dev*100:.1f}%)."
                )
        except Exception as e:
            violations.append(f"FX_LOOKUP_ERROR: {str(e)}")

        # 5. Route validation
        if route not in self.settings.ALLOWED_CORRIDORS:
            violations.append(f"UNAUTHORIZED_ROUTE: Corridor '{route}' is not in approved corridor whitelist.")

        return (len(violations) == 0, violations)


payment_gateway = MockPaymentGateway()
