# SentinelPay

Autonomous merchant risk orchestration for Razorpay-style onboarding and post-onboarding monitoring.

## Stack

- Backend: FastAPI, SQLAlchemy, SQLite, Pydantic
- Frontend: Next.js, TypeScript, Tailwind CSS, Recharts, Lucide icons
- Demo mode: seeded merchants, mock Razorpay actions, mock Meta ads, mock AI underwriter reports

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

## Demo Flows

- Register a merchant at `/merchant/register`.
- Review the trust score and decision in the response panel.
- Inspect the risk dashboard at `/admin`.
- Trigger rechecks from `/admin/rechecks`.
- Review AI memos and action cases from `/admin/reviews`.
- View website drift evidence from `/admin/diff/3`.
# Razorpay-OnboardingAgent
