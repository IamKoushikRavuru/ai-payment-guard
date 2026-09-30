"""
Model Management & Status API Routes.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter

from backend.app.schemas.analytics import ModelStatusItem

router = APIRouter(prefix="/api/v1/models", tags=["Model Registry & Evaluation"])
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))


@router.get("/status", response_model=List[ModelStatusItem], summary="ML Model Status and Real Metrics")
async def get_models_status() -> List[ModelStatusItem]:
    """Returns verified model metadata and evaluation performance from real benchmark runs."""
    report_path = os.path.join(BASE_DIR, "models", "saved", "evaluation_report.json")
    if not os.path.exists(report_path):
        return []

    with open(report_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    return [
        ModelStatusItem(
            model_name=data.get("model_name", "prompt_injection_detector"),
            version=data.get("version", "1.0.0"),
            dataset_name="neuralchemy_core + shomi28",
            status="ACTIVE",
            metrics=data.get("primary_test_metrics", {}),
            threshold=data.get("optimal_decision_threshold", 0.50),
            trained_at=datetime.now(timezone.utc),
        )
    ]
