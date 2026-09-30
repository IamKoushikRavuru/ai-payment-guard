"""
Script to Train ML Models.
Executes end-to-end model training, test evaluation, and artifact generation.
"""

from __future__ import annotations

import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.app.ml.training.trainer import train_prompt_injection_models

if __name__ == "__main__":
    report = train_prompt_injection_models()
    print("Training successfully finished.")
