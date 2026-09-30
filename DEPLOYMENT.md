# Deployment Guide: Render (Backend) & Vercel (Frontend)

This guide walks you through deploying **AegisFlow** to production:
- **Backend API & ML Engine** -> [Render](https://render.com) (Python / FastAPI / Uvicorn / WebSockets)
- **Frontend 3D SOC Dashboard** -> [Vercel](https://vercel.com) (React / Vite / Tailwind)

---

## Part 1: Deploy Backend to Render

### Option A: Automatic Blueprint (Recommended)
Because the repository includes `render.yaml`, Render can configure the entire service automatically:

1. Log into your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Blueprint**.
3. Connect your GitHub account and select `IamKoushikRavuru/ai-payment-guard`.
4. Render will read `render.yaml` and configure the web service automatically.
5. Click **Apply**.

---

### Option B: Manual Web Service Setup
If you prefer setting up the web service manually:

1. In [Render Dashboard](https://dashboard.render.com), click **New +** -> **Web Service**.
2. Select repository: `IamKoushikRavuru/ai-payment-guard`.
3. Configure the following fields:
   * **Name**: `ai-payment-guard-backend` (or any preferred name)
   * **Region**: Oregon (or closest to you)
   * **Branch**: `main`
   * **Root Directory**: Leave blank (uses repo root)
   * **Runtime**: `Python 3`
   * **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`
   * **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
   * **Instance Type**: Free

4. Add the following **Environment Variables**:
   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `PYTHON_VERSION` | `3.11.9` | Ensures exact Python runtime |
   | `ENVIRONMENT` | `production` | Production mode |
   | `DEBUG` | `false` | Disables debug logs |
   | `CORS_ORIGINS` | `["*"]` | Allows requests from your Vercel frontend |
   | `DATABASE_URL` | `sqlite+aiosqlite:///./payment_guard.db` | Local async SQLite database |
   | `SYNC_DATABASE_URL` | `sqlite:///./payment_guard.db` | Sync SQLite connection |
   | `AI_PROVIDER` | `mock` | Uses built-in local ML & deterministic security |

5. Click **Create Web Service**.
6. Wait 2-3 minutes for the build to finish. Once live, Render will provide your public backend URL, for example:
   ```
   https://ai-payment-guard-backend.onrender.com
   ```
7. Verify health by opening:
   ```
   https://ai-payment-guard-backend.onrender.com/health
   ```
   You should see: `{"status":"ok","service":"AI-Native Payment Observability & Threat Detection Engine","version":"1.0.0"}`

---

## Part 2: Deploy Frontend to Vercel

1. Log into your [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Select your GitHub repository: `IamKoushikRavuru/ai-payment-guard`.
4. In the project configuration:
   * **Framework Preset**: `Vite`
   * **Root Directory**: Click **Edit** and select `frontend`
   * **Build Command**: `npm run build` (default)
   * **Output Directory**: `dist` (default)
5. Expand **Environment Variables** and add:
   | Key | Value | Example |
   | :--- | :--- | :--- |
   | `VITE_API_BASE_URL` | Your Render Backend URL | `https://ai-payment-guard-backend.onrender.com` |

   > **Note**: You do *not* need to set `VITE_WS_URL`. The frontend automatically derives `wss://...` directly from `VITE_API_BASE_URL`!

6. Click **Deploy**.
7. In ~30 seconds, your site will be live at:
   ```
   https://ai-payment-guard.vercel.app
   ```

---

## Part 3: Verify the Live Production Deployment

1. Visit your Vercel URL:
   * The **Creative 3D Homepage** should load with interactive card hover tilt effects.
   * The TopBar indicator should display `CORE RUNTIME OPERATIONAL`.
2. Register a new user or click **Auto-fill Demo Analyst** and sign in.
3. Access the full **SOC Dashboard**:
   * Test **Simulate** or **Agent Console** to generate transactions.
   * Open the **Notifications Popover** in the top right to verify live event notifications over WebSockets.
