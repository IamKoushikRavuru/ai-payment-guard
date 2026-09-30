"""
Prompt Injection Detector Service.
Performs real-time ML-powered detection with calibrated risk probabilities,
technique classification, and structural attack signal analysis.
"""

from __future__ import annotations

import logging
import os
import joblib
from typing import Any, Dict, Optional

from backend.app.ml.preprocessing.text_cleaner import preprocessor

logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
MODELS_DIR = os.path.join(BASE_DIR, "models", "saved")


class PromptInjectionDetector:
    def __init__(self) -> None:
        self.binary_model = None
        self.technique_model = None
        self._load_models()

    def _load_models(self) -> None:
        binary_path = os.path.join(MODELS_DIR, "prompt_injection_detector.joblib")
        tech_path = os.path.join(MODELS_DIR, "technique_classifier.joblib")

        if os.path.exists(binary_path):
            try:
                self.binary_model = joblib.load(binary_path)
                logger.info("Loaded prompt injection classifier from %s", binary_path)
            except Exception as e:
                logger.error("Error loading binary classifier: %s", e)

        if os.path.exists(tech_path):
            try:
                self.technique_model = joblib.load(tech_path)
                logger.info("Loaded technique classifier from %s", tech_path)
            except Exception as e:
                logger.error("Error loading technique classifier: %s", e)

    def scan(self, text: str, threshold: float = 0.80) -> Dict[str, Any]:
        """
        Scans input prompt for injection, jailbreak, and instruction manipulation.
        Returns: structured threat evaluation dictionary.
        """
        cleaned = preprocessor.clean_text(text)
        syntactic_features = preprocessor.extract_syntactic_security_features(cleaned)

        # Fallback heuristic if ML model is unavailable
        if self.binary_model is None:
            is_rule_threat = (
                syntactic_features["has_system_delimiter"]
                or syntactic_features["has_role_override"]
                or syntactic_features["has_financial_override"]
            )
            return {
                "is_threat": is_rule_threat,
                "threat_type": "prompt_injection" if is_rule_threat else "none",
                "confidence": 0.85 if is_rule_threat else 0.10,
                "severity": "HIGH" if is_rule_threat else "LOW",
                "technique": "heuristic_pattern_match" if is_rule_threat else "benign",
                "explanation": "Heuristic match on delimiter or override keywords."
                if is_rule_threat
                else "No threat detected.",
                "syntactic_features": syntactic_features,
            }

        # Predict probability using calibrated model
        prob = float(self.binary_model.predict_proba([cleaned])[0, 1])

        # Syntactic boost: If prompt contains explicit injection syntax, adjust probability
        if syntactic_features["has_system_delimiter"] or syntactic_features["has_role_override"]:
            prob = max(prob, 0.92)

        is_threat = prob >= threshold

        # Determine technique
        technique = "direct_injection"
        if self.technique_model is not None and is_threat:
            technique = str(self.technique_model.predict([cleaned])[0])
            if technique == "benign":
                technique = "direct_injection"
        elif not is_threat:
            technique = "benign"

        # Map severity based on probability and technique
        if not is_threat:
            severity = "LOW"
            explanation = "Prompt analyzed: legitimate user instruction with no injection patterns."
        elif prob >= 0.85 or technique in ("jailbreak", "financial_manipulation"):
            severity = "CRITICAL" if technique == "financial_manipulation" else "HIGH"
            explanation = f"Detected {technique.replace('_', ' ')} with confidence {prob*100:.1f}%."
        else:
            severity = "MEDIUM"
            explanation = f"Suspicious prompt pattern detected (confidence {prob*100:.1f}%)."

        return {
            "is_threat": is_threat,
            "threat_type": "prompt_injection" if is_threat else "none",
            "confidence": round(prob, 4),
            "severity": severity,
            "technique": technique,
            "explanation": explanation,
            "syntactic_features": syntactic_features,
        }


prompt_injection_detector = PromptInjectionDetector()
