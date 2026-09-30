"""
Main FastAPI Application Entrypoint.
Initializes lifespan handlers, security middleware, database schemas, and API routers.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.routes import (
    agent,
    alerts,
    analytics,
    auth,
    health,
    models,
    security,
    sessions,
    simulation,
    stream,
    transactions,
)
from backend.app.core.config import get_settings
from backend.app.core.logging import setup_logging
from backend.app.database.connection import init_db
from backend.app.middleware.request_logging import RequestLoggingMiddleware

settings = get_settings()
setup_logging(settings.LOG_LEVEL)
logger = logging.getLogger("main")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan lifecycle events."""
    logger.info("Initializing %s v%s...", settings.PROJECT_NAME, settings.VERSION)

    # 1. Initialize Database Schema
    try:
        await init_db()
    except Exception as e:
        logger.error("Database initialization failed: %s", e)

    # 2. Startup Connectivity Check for AI Provider
    is_valid, validation_msg = settings.validate_ai_provider_connectivity()
    if is_valid:
        logger.info("[AI Provider Validation] %s", validation_msg)
    else:
        logger.warning("[AI Provider Validation] %s", validation_msg)

    logger.info("Application startup complete. Ready for secure payment processing.")
    yield
    logger.info("Shutting down payment observability engine.")


app = FastAPI(
    title="AI-Native Observability & Threat Detection Engine for Global Payment APIs",
    description=(
        "Enterprise-grade runtime security, prompt injection detection, financial logic validation, "
        "and PCI DLP redaction engine for autonomous payment agents."
    ),
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Auditing & Correlation ID Middleware
app.add_middleware(RequestLoggingMiddleware)

# Include API Routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(agent.router)
app.include_router(sessions.router)
app.include_router(security.router)
app.include_router(alerts.router)
app.include_router(analytics.router)
app.include_router(models.router)
app.include_router(simulation.router)
app.include_router(stream.router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
