# SentinelPay

Autonomous merchant risk orchestration for Razorpay-style onboarding and post-onboarding monitoring.

## Stack

- Backend: FastAPI, SQLAlchemy, SQLite, Pydantic
- Frontend: Next.js, TypeScript, Tailwind CSS, Recharts, Lucide icons
- Real mode by default: live website crawl/extraction, SQLite persistence, scheduled background rechecks, deterministic risk rules
- Optional integrations: Razorpay account activation, Meta Ad Library, and LLM underwriter reports once credentials are configured

## Run Locally

Backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000/admin`.

## What You Must Provide For Production-Like Use

- Real merchant website URLs and policy URLs.
- KYB document files or document storage keys.
- Razorpay partner/sandbox credentials for real account activation workflows.
- Meta Ad Library token for live ad checks.
- Groq API key for fast free-tier LLM underwriter reports. OpenAI is still supported as a fallback.
- PostgreSQL/Supabase URL if you do not want local SQLite.

## Test Flows

- Register a merchant at `/merchant/register`.
- Review the trust score and decision in the response panel.
- Inspect the risk dashboard at `/admin`.
- Trigger rechecks from `/admin/rechecks`.
- Review AI memos and action cases from `/admin/reviews`.
- View website drift evidence from `/admin/diff/3`.
# Razorpay-OnboardingAgent
