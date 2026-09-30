# ==============================================================================
# AI-Native Observability & Threat Detection Engine for Global Payment APIs
# Multi-Stage Production Dockerfile (Render & Cloud Container Compatible)
# ==============================================================================

FROM python:3.11-slim AS builder

WORKDIR /app

# Install system build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# Install into standard prefix /install so packages can be copied to /usr/local
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Final Runtime Image
FROM python:3.11-slim AS runner

WORKDIR /app

# Install runtime dependencies for postgres and health check
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy python dependencies globally into /usr/local (world-readable, no root permission issues)
COPY --from=builder /install /usr/local

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Copy application source code, models, and scripts
COPY backend/ ./backend/
COPY models/ ./models/
COPY data/ ./data/
COPY scripts/ ./scripts/
COPY .env.example .env

# Create non-root user and ensure full ownership of working directory for SQLite db
RUN useradd -m -u 1001 appuser && \
    mkdir -p /app/data /app/models && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Support dynamic Render $PORT or fallback to 8000
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
