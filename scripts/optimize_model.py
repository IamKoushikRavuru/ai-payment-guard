"""
Hyperparameter & Threshold Optimization for False Positive Rate Reduction.
"""

import os
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.calibration import CalibratedClassifierCV
from sklearn.svm import LinearSVC
from sklearn.metrics import confusion_matrix

base = r"C:\KOUSHIK\ai-payment-guard"
train = pd.read_parquet(os.path.join(base, "data", "processed", "train.parquet"))
test = pd.read_parquet(os.path.join(base, "data", "processed", "test.parquet"))
bench = pd.read_parquet(os.path.join(base, "data", "processed", "benchmark_shomi28.parquet"))

for ngram in [(1, 2), (1, 3)]:
    vec = TfidfVectorizer(
        ngram_range=ngram,
        sublinear_tf=True,
        min_df=2,
        max_features=16000,
        token_pattern=r"(?u)\b\w+\b|[!@#$%^&*()_+\-=\[\]{};':\",.<>?/\\|`~]",
    )
    for c_val in [0.5, 1.0]:
        pipe = Pipeline([
            ("tfidf", vec),
            ("clf", CalibratedClassifierCV(estimator=LinearSVC(C=c_val, random_state=42), cv=3, method="sigmoid"))
        ])
        pipe.fit(train["text"], train["label"])
        probs_bench = pipe.predict_proba(bench["text"])[:, 1]
        probs_test = pipe.predict_proba(test["text"])[:, 1]
        for t in [0.75, 0.80, 0.82]:
            tn_b, fp_b, fn_b, tp_b = confusion_matrix(bench["label"], probs_bench >= t).ravel()
            tn_t, fp_t, fn_t, tp_t = confusion_matrix(test["label"], probs_test >= t).ravel()
            fpr_b = fp_b / (fp_b + tn_b)
            fpr_t = fp_t / (fp_t + tn_t)
            f1_b = 2 * tp_b / (2 * tp_b + fp_b + fn_b)
            f1_t = 2 * tp_t / (2 * tp_t + fp_t + fn_t)
            print(f"ngram={ngram}, C={c_val}, t={t:.2f} | Bench FPR: {fpr_b*100:.2f}%, F1: {f1_b:.4f} | Test FPR: {fpr_t*100:.2f}%, F1: {f1_t:.4f}")
