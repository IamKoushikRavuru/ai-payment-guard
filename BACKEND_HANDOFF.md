# AegisFlow — Backend Handoff Guide

## Project
**AegisFlow — AI Payment Security**  
*(AI-Native Observability & Threat Detection Engine for Global Payment APIs)*

---

## Backend Stack
- **Web Framework**: FastAPI 0.115+ (Python 3.11+) with Async/Await architecture
- **ASGI Server**: Uvicorn with ASGI multi-worker support
- **Data Validation & Settings**: Pydantic v2 & Pydantic-Settings
- **Database & ORM**: SQLAlchemy 2.0 Async (`asyncpg` / `aiosqlite`) + SQLite / PostgreSQL
- **Machine Learning & NLP**:
  - `scikit-learn` 1.7.2 (Calibrated `LinearSVC` with sigmoid probability scaling)
  - `joblib` for serialized pipeline persistence
  - Hugging Face datasets (`neuralchemy/Prompt-injection-dataset` & `Shomi28/prompt-injection-dataset`)
- **Security & DLP**:
  - Strict ISO/IEC 7812 **Luhn algorithm checksum** validator
  - PCI-DSS cardholder data redaction (PAN, CVV, API keys, IBANs)
- **Mathematical & Statistical Drift**:
  - Population Stability Index (PSI)
  - Normalized Wasserstein Distance (Earth Mover's Distance)
- **Real-Time Streaming**: Native WebSockets with multi-client async broadcasting
- **Testing & Quality Assurance**: Pytest (35 automated tests), Coverage, Flake8/Black compliant

---

## How to Run
```bash
# 1. Ensure dependencies are installed
pip install -r requirements.txt

# 2. Run the FastAPI development server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Run with Docker Compose
```bash
docker compose up --build
```

---

## How to Test
```bash
# Run the complete test suite (all 35 tests)
python -m pytest tests/ -v

# Run the 7-vector automated red-team security verification
python scripts/red_team_simulator.py

# Run model evaluation against primary and OOD benchmarks
python scripts/evaluate_models.py
```

---

## API URL
`http://localhost:8000`

---

## Swagger
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI 3.1 JSON**: `http://localhost:8000/openapi.json`

---

## Realtime
- **WebSocket URL**: `ws://localhost:8000/ws/security-events`
- **Protocol**: Standard WebSocket (JSON frames). Pre-configured with automatic client broadcasting upon threat detection, transaction evaluation, or simulation events. Supports `"ping"` / `{"type": "PONG"}` heartbeats.

---

## Frontend Integration (Instructions for Claude)
1. **API Client**: Point your HTTP client (Axios, Fetch, or React Query) to `http://localhost:8000`. All endpoints use standard REST JSON with complete schemas defined in `FRONTEND_INTEGRATION.md` and `openapi.json`.
2. **CORS**: `http://localhost:5173` (Vite) and `http://localhost:3000` (Next.js) are explicitly enabled in `CORS_ORIGINS`.
3. **Real-Time Feed**: Connect the dashboard's live feed component to `ws://localhost:8000/ws/security-events`. Prepend incoming `SECURITY_EVENT` frames to the alert list in real time.
4. **Autonomous Agent Chat**: When sending prompts to `/api/v1/agent/evaluate`, pass a persistent `session_id`. The backend will maintain stateful multi-turn conversation tracking, detect crescendo attacks, and lock sessions that accumulate repeat violations.
5. **Simulated Traffic**: To demonstrate dynamic charts on a fresh install, call `POST /api/v1/simulation/run` with `{"scenario_type": "mixed", "count": 20}` to immediately populate the ledger and metrics.

---

## Known Genuine Limitations
1. **In-Memory Multi-Turn Session State**: The conversational session tracker (`SessionTracker`) stores session turn trajectories in process memory. In a multi-worker production cluster with horizontal scaling across multiple machines, a Redis-backed session store would be required for shared state.
2. **Synthetic Red-Team Latency**: The mock payment gateway uses local benchmark FX rates and synthetic corridor latency (5–12ms). Real banking core networks (SWIFT gpi, FedNow) experience higher network transit latencies (100–500ms).
3. **No Raw Secrets in Repository**: External AI provider API keys are not bundled. The platform defaults to the local zero-trust defense engine and fallback agent, which run 100% locally with zero external network dependencies.
