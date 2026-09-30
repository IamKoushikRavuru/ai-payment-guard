# Dataset Provenance, Licenses, and Preprocessing Specifications

This document catalogs all datasets utilized for training and evaluating the ML security models in the AI-Native Payment Observability & Threat Detection Engine.

---

## 1. Primary Dataset: Neuralchemy Prompt Injection Dataset (Core Configuration)

- **Name**: `neuralchemy/Prompt-injection-dataset`
- **Repository URL**: [https://huggingface.co/datasets/neuralchemy/Prompt-injection-dataset](https://huggingface.co/datasets/neuralchemy/Prompt-injection-dataset)
- **License**: Apache License 2.0 (Permissive, commercial and private use allowed with attribution)
- **Primary Purpose**: Training and primary validation of prompt injection, jailbreak, and instruction-override detection models.
- **Raw Fields**:
  - `text` (string): The raw prompt instruction text.
  - `label` (int): Binary indicator (1 = Threat / Injection, 0 = Benign).
  - `category` (string): Attack technique/classification (`direct_injection`, `jailbreak`, `adversarial`, `encoding`, `system_manipulation`, `benign`, etc.).
  - `severity` (string): Threat severity level (`low`, `medium`, `high`, `critical`).
  - `source` (string): Origin dataset or benchmark suite.
  - `tags` (list/string): Additional metadata tags.
- **Preprocessing & Cleaning**:
  1. Removal of duplicate prompt texts to prevent train/test data leakage.
  2. Whitespace trimming and unicode normalization.
  3. Handling missing severity labels by mapping benign prompts to `LOW` and unclassified threats to `MEDIUM` / `HIGH` depending on category.
  4. Augmentation with financial-domain payment prompts (benign cross-border instructions and adversarial financial manipulation attacks) to specialize the classifier for fintech operations.
- **Limitations**:
  - Contains generic LLM injection prompts that may not include fintech-specific terms (e.g., SWIFT, SEPA, ACH, FX spread), necessitating financial domain augmentation.

---

## 2. Secondary Benchmark Dataset: Shomi28 Prompt Injection Dataset

- **Name**: `Shomi28/prompt-injection-dataset`
- **Repository URL**: [https://huggingface.co/datasets/Shomi28/prompt-injection-dataset](https://huggingface.co/datasets/Shomi28/prompt-injection-dataset)
- **License**: MIT License (Permissive open source)
- **Primary Purpose**: Independent out-of-distribution benchmark evaluation to measure generalization across different prompt injection authors and distributions.
- **Raw Fields**:
  - `text` (string): Prompt content.
  - `label` (int): 1 = Injection / Malicious, 0 = Safe.
  - `label_name` (string): Human-readable label ('injection' or 'safe').
- **Preprocessing**:
  1. Kept strictly isolated from training data.
  2. Evaluated zero-shot by the trained model to assess real-world out-of-domain robustness.
- **Limitations**:
  - Smaller size (~1,024 samples), balanced 50/50 split between injection and safe prompts.
