"""
Database Repository Layer.
Provides high-performance async abstractions for data access and auditing.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import delete, desc, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.models import (
    AgentBaselineModel,
    AgentEventModel,
    AlertModel,
    ModelMetadataModel,
    SecurityEventModel,
    SimulationRunModel,
    TransactionModel,
    UserModel,
)


class TransactionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, tx_data: Dict[str, Any]) -> TransactionModel:
        tx = TransactionModel(**tx_data)
        self.session.add(tx)
        await self.session.commit()
        await self.session.refresh(tx)
        return tx

    async def get_by_id(self, tx_id: str) -> Optional[TransactionModel]:
        stmt = select(TransactionModel).where(TransactionModel.id == tx_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def list_recent(self, limit: int = 50, offset: int = 0) -> List[TransactionModel]:
        stmt = select(TransactionModel).order_by(desc(TransactionModel.created_at)).limit(limit).offset(offset)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count_all(self) -> int:
        stmt = select(func.count(TransactionModel.id))
        result = await self.session.execute(stmt)
        return result.scalar() or 0

    async def count_by_status(self, status: str) -> int:
        stmt = select(func.count(TransactionModel.id)).where(TransactionModel.status == status)
        result = await self.session.execute(stmt)
        return result.scalar() or 0


class SecurityEventRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, event_data: Dict[str, Any]) -> SecurityEventModel:
        event = SecurityEventModel(**event_data)
        self.session.add(event)
        await self.session.commit()
        await self.session.refresh(event)
        return event

    async def get_by_id(self, event_id: str) -> Optional[SecurityEventModel]:
        stmt = select(SecurityEventModel).where(SecurityEventModel.id == event_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def list_recent(
        self, limit: int = 50, offset: int = 0, severity: Optional[str] = None
    ) -> List[SecurityEventModel]:
        stmt = select(SecurityEventModel).order_by(desc(SecurityEventModel.created_at))
        if severity:
            stmt = stmt.where(SecurityEventModel.severity == severity.upper())
        stmt = stmt.limit(limit).offset(offset)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count_all(self) -> int:
        stmt = select(func.count(SecurityEventModel.id))
        result = await self.session.execute(stmt)
        return result.scalar() or 0


class AlertRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, alert_data: Dict[str, Any]) -> AlertModel:
        alert = AlertModel(**alert_data)
        self.session.add(alert)
        await self.session.commit()
        await self.session.refresh(alert)
        return alert

    async def list_recent(self, limit: int = 50, offset: int = 0, is_resolved: Optional[bool] = None) -> List[AlertModel]:
        stmt = select(AlertModel).order_by(desc(AlertModel.created_at))
        if is_resolved is not None:
            stmt = stmt.where(AlertModel.is_resolved == is_resolved)
        stmt = stmt.limit(limit).offset(offset)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(self, alert_id: str) -> Optional[AlertModel]:
        stmt = select(AlertModel).where(AlertModel.id == alert_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def resolve(self, alert_id: str, resolved_by: str) -> Optional[AlertModel]:
        alert = await self.get_by_id(alert_id)
        if alert:
            alert.is_resolved = True
            alert.resolved_at = datetime.now(timezone.utc)
            alert.resolved_by = resolved_by
            await self.session.commit()
            await self.session.refresh(alert)
        return alert

    async def count_active(self) -> int:
        stmt = select(func.count(AlertModel.id)).where(AlertModel.is_resolved == False)
        result = await self.session.execute(stmt)
        return result.scalar() or 0

    async def count_by_severity(self, severity: str) -> int:
        stmt = select(func.count(AlertModel.id)).where(
            AlertModel.severity == severity.upper(), AlertModel.is_resolved == False
        )
        result = await self.session.execute(stmt)
        return result.scalar() or 0


class BaselineRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def upsert(self, metric_name: str, mean: float, std: float, p50: float, p95: float, p99: float, count: int) -> AgentBaselineModel:
        stmt = select(AgentBaselineModel).where(AgentBaselineModel.metric_name == metric_name)
        result = await self.session.execute(stmt)
        baseline = result.scalars().first()
        if baseline:
            baseline.mean = mean
            baseline.std = std
            baseline.p50 = p50
            baseline.p95 = p95
            baseline.p99 = p99
            baseline.sample_count = count
            baseline.updated_at = datetime.now(timezone.utc)
        else:
            baseline = AgentBaselineModel(
                metric_name=metric_name,
                mean=mean,
                std=std,
                p50=p50,
                p95=p95,
                p99=p99,
                sample_count=count,
            )
            self.session.add(baseline)
        await self.session.commit()
        await self.session.refresh(baseline)
        return baseline

    async def get_all(self) -> List[AgentBaselineModel]:
        stmt = select(AgentBaselineModel)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())


class ModelMetadataRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def record_model(
        self, model_name: str, version: str, dataset_name: str, metrics: Dict[str, Any], threshold: float
    ) -> ModelMetadataModel:
        meta = ModelMetadataModel(
            model_name=model_name,
            version=version,
            dataset_name=dataset_name,
            metrics=metrics,
            threshold=threshold,
            status="ACTIVE",
        )
        self.session.add(meta)
        await self.session.commit()
        await self.session.refresh(meta)
        return meta

    async def get_latest(self, model_name: str) -> Optional[ModelMetadataModel]:
        stmt = (
            select(ModelMetadataModel)
            .where(ModelMetadataModel.model_name == model_name)
            .order_by(desc(ModelMetadataModel.trained_at))
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()


class UserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, user_data: Dict[str, Any]) -> UserModel:
        user = UserModel(**user_data)
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def get_by_id(self, user_id: str) -> Optional[UserModel]:
        stmt = select(UserModel).where(UserModel.id == user_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_by_email(self, email: str) -> Optional[UserModel]:
        stmt = select(UserModel).where(UserModel.email == email.strip().lower())
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_by_username(self, username: str) -> Optional[UserModel]:
        stmt = select(UserModel).where(UserModel.username == username.strip().lower())
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def list_recent(self, limit: int = 50) -> List[UserModel]:
        stmt = select(UserModel).order_by(desc(UserModel.created_at)).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

