"""
Database Connection & Session Management.
Supports both PostgreSQL (production/docker) and SQLite (zero-config local dev).
"""

from __future__ import annotations

import logging
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from backend.app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Base declarative class for SQLAlchemy models
Base = declarative_base()

# Configure engine with connection pooling options appropriate for driver
engine_kwargs = {"echo": settings.DEBUG}
if "sqlite" in settings.DATABASE_URL:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine: AsyncEngine = create_async_engine(settings.DATABASE_URL, **engine_kwargs)
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for providing database sessions to API routes."""
    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initializes schema and tables if they don't already exist."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database schema initialized successfully.")
