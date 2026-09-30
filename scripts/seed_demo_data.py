"""
Seed Script for Demo Transactions, Historical Baselines, and SOC Events.
Populates the database with realistic baseline transactions so the dashboard has rich data.
"""

from __future__ import annotations

import asyncio
import os
import sys
import uuid
from datetime import datetime, timezone

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.app.database.connection import async_session_factory, init_db
from backend.app.database.models import AgentBaselineModel, TransactionModel
from backend.app.database.repositories import (
    BaselineRepository,
    SecurityEventRepository,
    TransactionRepository,
)
from backend.app.services.observability import observability_service
from backend.app.services.payment_gateway import payment_gateway
from backend.app.services.risk_engine import risk_engine
from backend.app.services.transaction_simulator import TransactionSimulator


async def seed_data() -> None:
    print("Initializing database...")
    await init_db()

    print("Seeding baseline statistical profiles...")
    async with async_session_factory() as session:
        base_repo = BaselineRepository(session)
        await base_repo.upsert("transaction_amount", mean=3200.0, std=2100.0, p50=2800.0, p95=7500.0, p99=12000.0, count=500)
        await base_repo.upsert("decision_latency_ms", mean=14.2, std=4.5, p50=12.0, p95=22.0, p99=35.0, count=500)
        await base_repo.upsert("approval_rate", mean=0.92, std=0.04, p50=0.93, p95=0.98, p99=0.99, count=500)

    print("Generating and processing 25 synthetic transactions through the live engine...")
    simulator = TransactionSimulator(seed=101)
    scenarios = simulator.generate_batch(count=25, scenario_type="mixed")

    async with async_session_factory() as session:
        tx_repo = TransactionRepository(session)

        for sc in scenarios:
            try:
                rate = payment_gateway.get_market_exchange_rate(sc["source_currency"], sc["destination_currency"])
            except Exception:
                rate = 1.0

            dest_amt = round(sc["amount"] * rate, 2)
            assessment = risk_engine.assess(
                prompt=sc["prompt"],
                transaction_params={
                    "source_currency": sc["source_currency"],
                    "destination_currency": sc["destination_currency"],
                    "amount": sc["amount"],
                    "exchange_rate": rate,
                    "destination_amount": dest_amt,
                    "destination_country": sc["destination_country"],
                    "route": sc["route"],
                },
            )

            status = "BLOCKED" if assessment.recommended_action == "BLOCK" else (
                "FLAGGED" if assessment.recommended_action == "FLAG" else "APPROVED"
            )

            tx_id = f"tx_seed_{uuid.uuid4().hex[:8]}"
            await tx_repo.create({
                "id": tx_id,
                "user_id": sc["user_id"],
                "source_currency": sc["source_currency"],
                "destination_currency": sc["destination_currency"],
                "amount": sc["amount"],
                "exchange_rate": rate,
                "destination_amount": dest_amt,
                "destination_country": sc["destination_country"],
                "route": sc["route"],
                "status": status,
                "risk_score": assessment.risk_score,
                "decision_reason": assessment.summary_explanation,
                "execution_latency_ms": 6.2,
            })

            # Record threat events
            for sig in assessment.signals:
                if sig.is_threat:
                    await observability_service.record_security_event(
                        session=session,
                        event_type=sig.detector.upper(),
                        severity=sig.severity,
                        risk_score=sig.risk_score,
                        confidence=sig.confidence,
                        source=sig.detector,
                        description=sig.explanation,
                        action=assessment.recommended_action,
                        transaction_id=tx_id,
                        payload_snippet=sc["prompt"],
                    )

    print("Demo data seeded successfully into database!")


if __name__ == "__main__":
    asyncio.run(seed_data())
