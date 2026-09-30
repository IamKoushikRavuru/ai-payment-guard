"""
Script to bundle a clean, production-grade frontend integration package for Claude.
Excludes secrets, virtualenvs, databases, caches, and raw datasets.
"""

import os
import zipfile

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_ZIP = os.path.join(PROJECT_ROOT, "aegisflow-backend-integration.zip")

EXCLUDED_FILENAMES = {
    ".env",
    "payment_guard.db",
    ".coverage",
    ".DS_Store",
}

EXCLUDED_DIRNAMES = {
    "__pycache__",
    ".pytest_cache",
    ".venv",
    "venv",
    ".git",
    "raw",  # data/raw
}

ALLOWED_TOP_LEVEL_FILES = [
    "Dockerfile",
    "docker-compose.yml",
    "requirements.txt",
    ".env.example",
    ".gitignore",
    "FRONTEND_INTEGRATION.md",
    "BACKEND_HANDOFF.md",
    "README.md",
    "openapi.json",
]

ALLOWED_DIRS = [
    "backend",
    "models",
    "tests",
    "scripts",
]

def create_clean_package():
    print(f"Creating clean integration zip at: {OUTPUT_ZIP}")
    with zipfile.ZipFile(OUTPUT_ZIP, "w", zipfile.ZIP_DEFLATED) as zf:
        # 1. Add top-level files
        for fname in ALLOWED_TOP_LEVEL_FILES:
            fpath = os.path.join(PROJECT_ROOT, fname)
            if os.path.exists(fpath):
                arcname = os.path.join("aegisflow-backend", fname)
                zf.write(fpath, arcname)
                print(f"  + Added: {fname}")

        # 2. Add directories recursively
        for dir_name in ALLOWED_DIRS:
            dir_path = os.path.join(PROJECT_ROOT, dir_name)
            if not os.path.exists(dir_path):
                continue
            for root, dirs, files in os.walk(dir_path):
                # Filter out excluded directory names in-place
                dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRNAMES]

                for file in files:
                    if file in EXCLUDED_FILENAMES:
                        continue
                    if file.endswith((".pyc", ".pyo", ".pyd")):
                        continue

                    file_full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(file_full_path, PROJECT_ROOT)
                    arcname = os.path.join("aegisflow-backend", rel_path)
                    zf.write(file_full_path, arcname)

    size_mb = os.path.getsize(OUTPUT_ZIP) / (1024 * 1024)
    print(f"\nSuccessfully created {OUTPUT_ZIP} ({size_mb:.2f} MB)")

if __name__ == "__main__":
    create_clean_package()
