"""
Autonomous Payment Agent Service.
Simulates an autonomous AI payment agent handling cross-border payments, FX, and routing.
"""

from __future__ import annotations

import logging
import re
import time
import uuid
from typing import Any, Dict, Optional

from backend.app.core.config import get_settings
from backend.app.schemas.agent import AgentDecisionResponse
from backend.app.services.payment_gateway import payment_gateway

logger = logging.getLogger(__name__)


# Currency and Country mapping for natural language parsing
COUNTRY_TO_CURR = {
    "US": "USD",
    "USA": "USD",
    "UNITED STATES": "USD",
    "UK": "GBP",
    "UNITED KINGDOM": "GBP",
    "BRITAIN": "GBP",
    "GERMANY": "EUR",
    "FRANCE": "EUR",
    "SPAIN": "EUR",
    "ITALY": "EUR",
    "INDIA": "INR",
    "JAPAN": "JPY",
    "BRAZIL": "BRL",
    "AUSTRALIA": "AUD",
    "CANADA": "CAD",
    "SINGAPORE": "SGD",
    "NORTH KOREA": "KP",
    "IRAN": "IR",
    "CUBA": "CU",
    "SYRIA": "SY",
}

CURR_TO_DEFAULT_COUNTRY = {
    "USD": "US",
    "EUR": "DE",
    "GBP": "GB",
    "INR": "IN",
    "JPY": "JP",
    "BRL": "BR",
    "AUD": "AU",
    "CAD": "CA",
    "SGD": "SG",
    "AED": "AE",
}


class AutonomousPaymentAgent:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.agent_id = "autonomous_payment_agent_v1"

    def _extract_intent_from_prompt(self, prompt: str) -> Dict[str, Any]:
        """
        Parses amount, currencies, and destination from free-form natural language.
        """
        p_upper = prompt.upper()

        # Extract amount (e.g. 500, 10,000, $500, 500.50)
        amount_match = re.search(r"(?:[$€£₹]\s*)?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)", prompt)
        amount = 1000.0
        if amount_match:
            try:
                amount_str = amount_match.group(1).replace(",", "")
                amount = float(amount_str)
            except Exception:
                amount = 1000.0

        # Extract explicit currencies
        found_currencies = [c for c in self.settings.SUPPORTED_CURRENCIES if c in p_upper]
        source_curr = found_currencies[0] if len(found_currencies) >= 1 else "USD"
        dest_curr = found_currencies[1] if len(found_currencies) >= 2 else ("EUR" if source_curr == "USD" else "USD")

        # Extract destination country if mentioned
        dest_country = CURR_TO_DEFAULT_COUNTRY.get(dest_curr, "DE")
        for country_key, code in COUNTRY_TO_CURR.items():
            if country_key in p_upper:
                if code in ["KP", "IR", "CU", "SY"]:
                    dest_country = code
                elif code in CURR_TO_DEFAULT_COUNTRY.values():
                    dest_country = code

        # Check if corridor requested
        route = None
        for corr in self.settings.ALLOWED_CORRIDORS:
            if corr in p_upper:
                route = corr
                break
        if not route:
            route = payment_gateway.select_optimal_corridor(dest_curr, dest_country, amount)

        return {
            "amount": amount,
            "source_currency": source_curr,
            "destination_currency": dest_curr,
            "destination_country": dest_country,
            "route": route,
        }

    async def evaluate_and_execute(
        self, prompt: str, user_id: str = "usr_client", context: Optional[Dict[str, Any]] = None
    ) -> AgentDecisionResponse:
        """
        Processes prompt through autonomous payment agent.
        Produces structured decision with explainability.
        """
        start_time = time.perf_counter()
        parsed = self._extract_intent_from_prompt(prompt)

        src_curr = parsed["source_currency"]
        dest_curr = parsed["destination_currency"]
        amount = parsed["amount"]
        dest_country = parsed["destination_country"]
        route = parsed["route"]

        # Calculate live benchmark exchange rate
        try:
            exchange_rate = payment_gateway.get_market_exchange_rate(src_curr, dest_curr)
        except Exception:
            exchange_rate = 1.0

        # Agent-level financial checks
        is_compliant, violations = payment_gateway.verify_financial_rules(
            source_currency=src_curr,
            destination_currency=dest_curr,
            amount=amount,
            exchange_rate=exchange_rate,
            destination_country=dest_country,
            route=route,
        )

        tx_id = f"tx_{uuid.uuid4().hex[:12]}"

        if not is_compliant:
            decision = "REJECT"
            reason = f"Agent financial policy check failed: {'; '.join(violations)}"
            agent_risk = 0.85
        else:
            decision = "APPROVE"
            reason = f"Routing {amount} {src_curr} to {dest_country} via {route} corridor at benchmark rate {exchange_rate}."
            agent_risk = 0.08

        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return AgentDecisionResponse(
            transaction_id=tx_id,
            source_currency=src_curr,
            destination_currency=dest_curr,
            amount=amount,
            exchange_rate=exchange_rate,
            destination_country=dest_country,
            route=route,
            decision=decision,
            reason=reason,
            agent_risk_score=agent_risk,
            raw_response=f"Decision: {decision}. {reason}",
            tool_calls=[
                {"tool": "get_market_exchange_rate", "args": {"from": src_curr, "to": dest_curr}, "result": exchange_rate},
                {"tool": "select_optimal_corridor", "args": {"country": dest_country, "currency": dest_curr}, "result": route},
            ],
            execution_latency_ms=latency_ms,
        )


agent_service = AutonomousPaymentAgent()
