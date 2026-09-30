"""
Evaluation Script for Model Benchmarking.
Evaluates model on test and benchmark sets using calibrated threshold=0.80,
displaying full confusion matrices, precision-recall characteristics, and taxonomy performance.
"""

from __future__ import annotations

import json
import os
import sys
import joblib
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
MODELS_DIR = os.path.join(BASE_DIR, "models", "saved")
OPTIMAL_THRESHOLD = 0.80


def evaluate() -> None:
    model_path = os.path.join(MODELS_DIR, "prompt_injection_detector.joblib")
    if not os.path.exists(model_path):
        print(f"Model not found at {model_path}. Please run train_models.py first.")
        sys.exit(1)

    clf = joblib.load(model_path)
    test_df = pd.read_parquet(os.path.join(PROCESSED_DIR, "test.parquet"))
    bench_df = pd.read_parquet(os.path.join(PROCESSED_DIR, "benchmark_shomi28.parquet"))

    print("==================================================================")
    print("AI-NATIVE PROMPT INJECTION DETECTOR EVALUATION REPORT")
    print(f"Optimal Calibrated Decision Threshold: {OPTIMAL_THRESHOLD}")
    print("==================================================================")

    # Primary Test Evaluation
    y_test = test_df["label"]
    y_proba = clf.predict_proba(test_df["text"])[:, 1]
    y_pred = (y_proba >= OPTIMAL_THRESHOLD).astype(int)

    print("\n--- 1. PRIMARY EVALUATION (Neuralchemy Core Test Set) ---")
    print(classification_report(y_test, y_pred, digits=4, target_names=["Benign", "Threat"]))
    tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
    print(f"Confusion Matrix: TP={tp}, FP={fp}, TN={tn}, FN={fn}")
    print(f"FPR (False Positive Rate): {fp / (fp + tn):.4f} ({fp / (fp + tn)*100:.2f}%)")
    print(f"FNR (False Negative Rate): {fn / (fn + tp):.4f} ({fn / (fn + tp)*100:.2f}%)")
    print(f"ROC-AUC: {roc_auc_score(y_test, y_proba):.4f}")

    # Benchmark Evaluation
    y_b_test = bench_df["label"]
    y_b_proba = clf.predict_proba(bench_df["text"])[:, 1]
    y_b_pred = (y_b_proba >= OPTIMAL_THRESHOLD).astype(int)

    print("\n--- 2. OUT-OF-DISTRIBUTION BENCHMARK (Shomi28 Dataset) ---")
    print(classification_report(y_b_test, y_b_pred, digits=4, target_names=["Safe", "Injection"]))
    b_tn, b_fp, b_fn, b_tp = confusion_matrix(y_b_test, y_b_pred).ravel()
    print(f"Confusion Matrix: TP={b_tp}, FP={b_fp}, TN={b_tn}, FN={b_fn}")
    print(f"FPR (False Positive Rate): {b_fp / (b_fp + b_tn):.4f} ({b_fp / (b_fp + b_tn)*100:.2f}%)")
    print(f"FNR (False Negative Rate): {b_fn / (b_fn + b_tp):.4f} ({b_fn / (b_fn + b_tp)*100:.2f}%)")
    print(f"ROC-AUC: {roc_auc_score(y_b_test, y_b_proba):.4f}")
    print("==================================================================")


if __name__ == "__main__":
    evaluate()
