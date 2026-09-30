import os

base = r"C:\KOUSHIK\ai-payment-guard"
pkg_dirs = [
    "backend",
    "backend/app",
    "backend/app/api",
    "backend/app/api/routes",
    "backend/app/core",
    "backend/app/models",
    "backend/app/schemas",
    "backend/app/services",
    "backend/app/services/detectors",
    "backend/app/ml",
    "backend/app/ml/training",
    "backend/app/ml/inference",
    "backend/app/ml/evaluation",
    "backend/app/ml/preprocessing",
    "backend/app/database",
    "backend/app/middleware",
    "tests",
    "scripts"
]

for p in pkg_dirs:
    full_dir = os.path.join(base, p.replace("/", os.sep))
    os.makedirs(full_dir, exist_ok=True)
    init_file = os.path.join(full_dir, "__init__.py")
    if not os.path.exists(init_file):
        with open(init_file, "w", encoding="utf-8") as f:
            f.write(f'"""Package {p}."""\n')

print("All package __init__.py files created successfully.")
