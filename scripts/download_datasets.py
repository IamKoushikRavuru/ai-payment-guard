"""
Dataset Downloader Script.
Downloads the primary and secondary Hugging Face datasets into data/raw/.
"""

from __future__ import annotations

import os
import sys
import urllib.request
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("download_datasets")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(BASE_DIR, "data", "raw")
os.makedirs(RAW_DIR, exist_ok=True)

DATASET_URLS = {
    "neuralchemy_core_train.parquet": "https://huggingface.co/api/datasets/neuralchemy/Prompt-injection-dataset/parquet/core/train/0.parquet",
    "neuralchemy_core_val.parquet": "https://huggingface.co/api/datasets/neuralchemy/Prompt-injection-dataset/parquet/core/validation/0.parquet",
    "neuralchemy_core_test.parquet": "https://huggingface.co/api/datasets/neuralchemy/Prompt-injection-dataset/parquet/core/test/0.parquet",
    "shomi28_train.parquet": "https://huggingface.co/api/datasets/Shomi28/prompt-injection-dataset/parquet/default/train/0.parquet",
    "shomi28_test.parquet": "https://huggingface.co/api/datasets/Shomi28/prompt-injection-dataset/parquet/default/test/0.parquet",
}


def download_file(url: str, dest_path: str) -> None:
    if os.path.exists(dest_path) and os.path.getsize(dest_path) > 1000:
        logger.info("File already exists: %s (%d bytes). Skipping download.", os.path.basename(dest_path), os.path.getsize(dest_path))
        return

    logger.info("Downloading %s -> %s...", url, os.path.basename(dest_path))
    req = urllib.request.Request(url, headers={"User-Agent": "AIPaymentGuard/1.0"})
    with urllib.request.urlopen(req, timeout=30) as response, open(dest_path, "wb") as out_file:
        data = response.read()
        out_file.write(data)
    logger.info("Downloaded %s successfully (%d bytes).", os.path.basename(dest_path), os.path.getsize(dest_path))


def main() -> None:
    logger.info("Starting dataset download process...")
    for filename, url in DATASET_URLS.items():
        dest = os.path.join(RAW_DIR, filename)
        try:
            download_file(url, dest)
        except Exception as e:
            logger.error("Failed downloading %s: %s", filename, e)
            sys.exit(1)
    logger.info("All datasets downloaded successfully into %s", RAW_DIR)


if __name__ == "__main__":
    main()
