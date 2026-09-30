"""
Model Training Pipeline for Prompt Injection & Jailbreak Detection.
Trains calibrated classifiers with optimized decision thresholds for ultra-low False Positive Rates.
"""

from __future__ import annotations

import json
import os
import sys
import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_recall_curve,
    precision_score,
    recall_score,
    roc_auc_score,
    auc,
)
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC

# Project root path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
MODELS_DIR = os.path.join(BASE_DIR, "models", "saved")
os.makedirs(MODELS_DIR, exist_ok=True)

OPTIMAL_THRESHOLD = 0.80


def train_prompt_injection_models() -> dict:
    print("Loading prepared datasets...")
    train_df = pd.read_parquet(os.path.join(PROCESSED_DIR, "train.parquet"))
    val_df = pd.read_parquet(os.path.join(PROCESSED_DIR, "val.parquet"))
    test_df = pd.read_parquet(os.path.join(PROCESSED_DIR, "test.parquet"))
    benchmark_df = pd.read_parquet(os.path.join(PROCESSED_DIR, "benchmark_shomi28.parquet"))

    print(f"Train samples: {len(train_df)}, Val: {len(val_df)}, Test: {len(test_df)}, Benchmark: {len(benchmark_df)}")

    X_train, y_train = train_df["text"], train_df["label"]
    X_val, y_val = val_df["text"], val_df["label"]
    X_test, y_test = test_df["text"], test_df["label"]
    X_bench, y_bench = benchmark_df["text"], benchmark_df["label"]

    # Calibrated Classifier Pipeline with C=0.5 for optimal margin generalization
    print("Building and training binary threat classifier pipeline...")
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        sublinear_tf=True,
        min_df=2,
        max_features=16000,
        token_pattern=r"(?u)\b\w+\b|[!@#$%^&*()_+\-=\[\]{};':\",.<>?/\\|`~]",
    )

    base_svc = LinearSVC(C=0.5, max_iter=2500, random_state=42)
    calibrated_clf = CalibratedClassifierCV(estimator=base_svc, cv=3, method="sigmoid")

    pipeline = Pipeline([
        ("tfidf", vectorizer),
        ("clf", calibrated_clf),
    ])

    pipeline.fit(X_train, y_train)

    # Evaluate on primary Test Split using calibrated optimal threshold
    print(f"Evaluating on primary test set with threshold={OPTIMAL_THRESHOLD}...")
    y_test_proba = pipeline.predict_proba(X_test)[:, 1]
    y_test_pred = (y_test_proba >= OPTIMAL_THRESHOLD).astype(int)

    acc = float(accuracy_score(y_test, y_test_pred))
    prec = float(precision_score(y_test, y_test_pred, zero_division=0))
    rec = float(recall_score(y_test, y_test_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_test_pred, zero_division=0))
    roc_auc = float(roc_auc_score(y_test, y_test_proba))

    p_curve, r_curve, _ = precision_recall_curve(y_test, y_test_proba)
    pr_auc = float(auc(r_curve, p_curve))

    tn, fp, fn, tp = confusion_matrix(y_test, y_test_pred).ravel()
    fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0
    fnr = float(fn / (fn + tp)) if (fn + tp) > 0 else 0.0

    test_metrics = {
        "dataset": "neuralchemy_core_test",
        "sample_count": len(test_df),
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1": round(f1, 4),
        "roc_auc": round(roc_auc, 4),
        "pr_auc": round(pr_auc, 4),
        "true_positives": int(tp),
        "false_positives": int(fp),
        "true_negatives": int(tn),
        "false_negatives": int(fn),
        "false_positive_rate": round(fpr, 4),
        "false_negative_rate": round(fnr, 4),
    }
    print(f"Test Set Metrics -> Accuracy: {acc*100:.2f}%, F1: {f1:.4f}, Precision: {prec:.4f}, Recall: {rec:.4f}, ROC-AUC: {roc_auc:.4f}, FPR: {fpr*100:.2f}%")

    # Evaluate Out-of-Distribution on Benchmark Shomi28 using calibrated threshold
    print(f"Evaluating on out-of-distribution Shomi28 benchmark set with threshold={OPTIMAL_THRESHOLD}...")
    y_bench_proba = pipeline.predict_proba(X_bench)[:, 1]
    y_bench_pred = (y_bench_proba >= OPTIMAL_THRESHOLD).astype(int)

    b_acc = float(accuracy_score(y_bench, y_bench_pred))
    b_prec = float(precision_score(y_bench, y_bench_pred, zero_division=0))
    b_rec = float(recall_score(y_bench, y_bench_pred, zero_division=0))
    b_f1 = float(f1_score(y_bench, y_bench_pred, zero_division=0))
    b_roc = float(roc_auc_score(y_bench, y_bench_proba))
    b_tn, b_fp, b_fn, b_tp = confusion_matrix(y_bench, y_bench_pred).ravel()
    b_fpr = float(b_fp / (b_fp + b_tn)) if (b_fp + b_tn) > 0 else 0.0
    b_fnr = float(b_fn / (b_fn + b_tp)) if (b_fn + b_tp) > 0 else 0.0

    benchmark_metrics = {
        "dataset": "shomi28_benchmark",
        "sample_count": len(benchmark_df),
        "accuracy": round(b_acc, 4),
        "precision": round(b_prec, 4),
        "recall": round(b_rec, 4),
        "f1": round(b_f1, 4),
        "roc_auc": round(b_roc, 4),
        "true_positives": int(b_tp),
        "false_positives": int(b_fp),
        "true_negatives": int(b_tn),
        "false_negatives": int(b_fn),
        "false_positive_rate": round(b_fpr, 4),
        "false_negative_rate": round(b_fnr, 4),
    }
    print(f"Shomi28 Benchmark -> Accuracy: {b_acc*100:.2f}%, F1: {b_f1:.4f}, Precision: {b_prec:.4f}, Recall: {b_rec:.4f}, ROC-AUC: {b_roc:.4f}, FPR: {b_fpr*100:.2f}%")

    # Technique Classifier (Multi-class mapping to attack taxonomy)
    print("Training attack technique / taxonomy classifier...")
    def map_taxonomy(cat: str) -> str:
        c = str(cat).lower()
        if "benign" in c or "safe" in c:
            return "benign"
        if "jailbreak" in c or "persona" in c:
            return "jailbreak"
        if "financial" in c or "compliance" in c or "limit" in c:
            return "financial_manipulation"
        if "instruction" in c or "override" in c:
            return "instruction_override"
        if "system" in c or "extraction" in c or "leak" in c:
            return "system_prompt_extraction"
        if "encoding" in c or "smuggling" in c:
            return "encoded_payload"
        if "adversarial" in c:
            return "adversarial_perturbation"
        return "direct_injection"

    y_tech_train = train_df["category"].apply(map_taxonomy)
    tech_pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=8000, sublinear_tf=True)),
        ("clf", LogisticRegression(max_iter=1000, C=1.0, random_state=42)),
    ])
    tech_pipeline.fit(X_train, y_tech_train)

    # Save Models
    binary_model_path = os.path.join(MODELS_DIR, "prompt_injection_detector.joblib")
    technique_model_path = os.path.join(MODELS_DIR, "technique_classifier.joblib")
    joblib.dump(pipeline, binary_model_path)
    joblib.dump(tech_pipeline, technique_model_path)
    print(f"Models saved to {MODELS_DIR}")

    # Compile Evaluation Report
    report = {
        "model_name": "prompt_injection_calibrated_linear_svc",
        "version": "1.1.0",
        "primary_test_metrics": test_metrics,
        "secondary_benchmark_metrics": benchmark_metrics,
        "taxonomy_classes": list(tech_pipeline.classes_),
        "optimal_decision_threshold": OPTIMAL_THRESHOLD,
    }

    report_path = os.path.join(MODELS_DIR, "evaluation_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print(f"Evaluation report written to {report_path}")

    return report


if __name__ == "__main__":
    train_prompt_injection_models()
