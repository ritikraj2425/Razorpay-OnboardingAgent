<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Python_3.12-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white" />
  <img src="https://img.shields.io/badge/MCP_Enabled-8B5CF6?style=for-the-badge" />
</p>

# SentinelPay

**Autonomous AI-powered merchant risk orchestration for Razorpay-style onboarding and post-onboarding monitoring.**

SentinelPay replaces manual KYC/KYB reviews with a fully autonomous multi-agent AI pipeline that verifies merchant identity, crawls their website, evaluates risk signals, generates underwriter reports, and continuously monitors merchants post-onboarding — all in real time.

> Built for **Razorpay Hackathon 2025**

**Live Demo:** [razorpay-onboardingagent.onrender.com](https://razorpay-onboardingagent.onrender.com)

---

## Table of Contents

- [Problem Statement](#-problem-statement)
- [Solution](#-solution)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [AI Verification Pipeline](#-ai-verification-pipeline)
- [4-Tier Recheck Engine](#-4-tier-recheck-engine)
- [MCP Integration](#-mcp-integration-model-context-protocol)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Test Flows](#-test-flows)
- [Screenshots](#-screenshots)

---

## Problem Statement

Payment gateways like Razorpay onboard thousands of merchants daily. Each merchant must be verified for:
- **Identity (KYC):** PAN, GSTIN, CIN, bank accounts, stakeholder verification
- **Website Compliance:** Prohibited content, policy pages, pricing transparency
- **Ongoing Risk:** Content drift, transaction spikes, complaint surges

Manual review is slow, expensive, and doesn't scale. Fraudulent merchants slip through, and legitimate ones face delays.

## Solution

SentinelPay automates the entire lifecycle:

1. **Day-0 Onboarding:** A 17-step AI pipeline that runs in seconds, not days
2. **Post-Onboarding Monitoring:** A 4-tier recheck engine that continuously monitors merchants
3. **MCP Integration:** External AI agents (Claude, Cursor) can onboard merchants via natural language
4. **Human-in-the-Loop:** Edge cases are escalated with AI-generated underwriter memos

---

## Key Features

| Feature | Description |
|---|---|
| **17-Step Verification Pipeline** | PAN → GSTIN → CIN → Bank → Website Crawl → Policy Audit → Prohibited Content → Trust Score → AI Risk Report |
| **Live Website Crawling** | Playwright-powered headless browser renders JavaScript SPAs and extracts products, prices, policies |
| **LLM Risk Investigation** | Gemini/Groq-powered AI reads crawled content and generates structured risk reports with underwriter memos |
| **4-Tier Recheck Engine** | Automated post-onboarding monitoring: Availability → Content Drift → Semantic Analysis → Full AI Investigation |
| **MCP Integration** | Model Context Protocol support — Claude Desktop can onboard merchants autonomously via natural language |
| **Interactive MCP Simulator** | Web-based demo that shows judges exactly how MCP works without needing Claude Desktop |
| **Grace Period System** | 48-hour remediation window for borderline merchants instead of outright rejection |
| **Trust Score Engine** | 0–100 composite score based on KYC, compliance, website quality, and risk signals |
| **Notification Queue** | Async event-driven architecture for merchant report delivery |
| **Interactive Architecture Diagram** | Dynamic SVG-based HLD with animated data flow paths |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           INPUT LAYER                                   │
│                                                                         │
│   Merchant ──(Web Form)──► Next.js Frontend                             │
│   Claude/Cursor ──(stdio)──► MCP Server (Python)                        │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                        APPLICATION LAYER                                │
│                                                                         │
│   Next.js ──(REST API)──► FastAPI Backend                               │
│   MCP Server ──(POST /register)──► FastAPI Backend                      │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                          AI PIPELINE                                    │
│                                                                         │
│   FastAPI ──(Orchestrate)──► AI Verification Engine                     │
│                                    ├── LLM (Gemini/Groq)                │
│                                    ├── Web Scraper (Playwright)         │
│                                    ├── KYC Validators                   │
│                                    └── Risk Scoring Engine              │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                       DATA & SCHEDULING                                 │
│                                                                         │
│   PostgreSQL ◄──(CRUD)──► FastAPI                                       │
│   APScheduler ──(Trigger Rechecks)──► FastAPI                           │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                        NOTIFICATIONS                                    │
│                                                                         │
│   Database ──(Events)──► Notification Queue (asyncio)                   │
│                              └──► Email/SMS Service                     │
└─────────────────────────────────────────────────────────────────────────┘
```

> **Interactive version available at** `/architecture` in the live app

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | High-performance async REST API framework |
| **SQLAlchemy 2.0** | ORM with mapped columns and type hints |
| **PostgreSQL / SQLite** | Production DB on Render / local dev with SQLite |
| **Pydantic v2** | Request/response validation and serialization |
| **Playwright** | Headless browser for JavaScript SPA crawling |
| **BeautifulSoup4** | HTML parsing and content extraction |
| **httpx** | Async HTTP client for external API calls |
| **APScheduler** | Background job scheduling for recurring rechecks |
| **MCP SDK** | Model Context Protocol server for AI agent integration |

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 16** | React framework with App Router and SSR |
| **TypeScript** | Type-safe frontend development |
| **Tailwind CSS** | Utility-first CSS framework |
| **Lucide Icons** | Beautiful, consistent icon library |
| **Recharts** | Data visualization for dashboards |

### AI / LLM
| Technology | Purpose |
|---|---|
| **Google Gemini** | Primary LLM for risk analysis (gemini-2.0-flash) |
| **Groq** | Fast free-tier LLM for underwriter report generation |
| **OpenAI** | Fallback LLM support |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Render** | Backend hosting (Docker) + PostgreSQL database |
| **Vercel** | Frontend hosting with edge deployment |
| **Docker** | Containerized backend with Playwright pre-installed |

---

## AI Verification Pipeline

When a merchant submits their application, SentinelPay executes a **17-step verification pipeline** in real-time:

| Step | Name | What it Does |
|---:|---|---|
| 1 | **Entity Registration** | Creates merchant record, assigns ID |
| 2 | **Document Intake** | Processes uploaded KYB documents |
| 3 | **PAN Verification** | Validates 10-digit PAN format, extracts holder type |
| 4 | **GSTIN Verification** | Validates 15-digit GSTIN, check digit, state code |
| 5 | **PAN-GSTIN Cross-Match** | Ensures PAN characters match GSTIN positions 3-12 |
| 6 | **CIN/LLPIN Verification** | Validates company/LLP registration (conditional) |
| 7 | **Stakeholder KYC** | Verifies director/partner PAN and designation |
| 8 | **Bank Account Verification** | Validates IFSC code, resolves bank name |
| 9 | **Bank Reuse Detection** | Checks for shared bank accounts across merchants |
| 10 | **Policy URL Differentiation** | Detects if all 4 policy URLs point to the same page |
| 11 | **Website Crawl** | Playwright headless browser renders the website |
| 12 | **Content Extraction** | Extracts products, prices, and text from crawled pages |
| 13 | **Policy Pages Audit** | Checks for refund, shipping, privacy, and terms pages |
| 14 | **Support Info Audit** | Extracts support email, phone, and address |
| 15 | **Prohibited Content Scan** | Scans for drugs, weapons, gambling, counterfeit keywords |
| 16 | **Trust Score Calculation** | Computes 0-100 composite score and makes decision |
| 17 | **AI Risk Investigation** | LLM generates structured risk report (for flagged merchants) |

### Decision Outcomes
- **APPROVED** → Payment gateway activated, API key issued
- **PENDING_REMEDIATION** → 48-hour grace period to fix issues
- **REJECTED** → If grace period expires with score < 85

---

## 4-Tier Recheck Engine

Post-onboarding, SentinelPay continuously monitors merchants using a **cost-optimized tiered architecture**:

| Tier | Name | Cadence | What it Does |
|---:|---|---|---|
| 1 | **Availability Check** | Every recheck | HTTP ping + status code verification |
| 2 | **Content Drift Detection** | If Tier 1 passes | SHA-256 hash comparison against baseline snapshot |
| 3 | **Semantic Analysis** | If Tier 2 detects drift | Vector distance scoring to measure content changes |
| 4 | **Full AI Investigation** | If Tier 3 exceeds threshold | Complete LLM re-evaluation with new underwriter report |

**Risk-based scheduling:**
- **High/Critical risk:** Recheck every 1 day
- **Medium risk:** Recheck every 7 days
- **Low risk:** Recheck every 30 days

---

## MCP Integration (Model Context Protocol)

SentinelPay implements the official **Model Context Protocol**, allowing external AI agents to onboard merchants autonomously.

### How it works
1. Merchant opens Claude Desktop and describes their business in natural language
2. Claude recognizes the `submit_merchant_application` MCP tool
3. Claude extracts structured data and sends it to the SentinelPay API
4. The full 17-step pipeline runs and returns the decision

### Setup (Claude Desktop)
Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "sentinelpay": {
      "command": "python",
      "args": ["/path/to/your/repo/backend/mcp_server.py"],
      "env": {
        "SENTINELPAY_API_URL": "https://razorpay-onboardingagent.onrender.com"
      }
    }
  }
}
```

### Web-based Simulator
Can't demo Claude Desktop? Use the **interactive MCP Simulator** at `/mcp/simulator` — it runs a live API call against the backend directly in the browser.

---

## Project Structure

```
Razorpay-OnboardingAgent/
├── backend/
│   ├── app/
│   │   ├── api/                    # REST API route handlers
│   │   │   ├── merchant_routes.py  # Registration, listing, diff
│   │   │   ├── admin_routes.py     # Admin dashboard endpoints
│   │   │   ├── recheck_routes.py   # Recheck trigger & results
│   │   │   └── review_routes.py    # Human review case management
│   │   ├── core/
│   │   │   ├── config.py           # Pydantic settings (env vars)
│   │   │   └── constants.py        # Prohibited keywords, thresholds
│   │   ├── models/                 # SQLAlchemy ORM models
│   │   │   ├── merchant.py         # Core merchant entity
│   │   │   ├── merchant_snapshot.py # Baseline website snapshots
│   │   │   ├── risk_signal.py      # Individual risk signals
│   │   │   ├── ai_report.py        # LLM-generated reports
│   │   │   ├── recheck_job.py      # Scheduled recheck jobs
│   │   │   ├── human_review_case.py # Cases escalated for review
│   │   │   └── ...
│   │   ├── schemas/                # Pydantic request/response models
│   │   ├── services/               # Business logic layer
│   │   │   ├── merchant_service.py # 17-step onboarding pipeline
│   │   │   ├── recheck_orchestrator.py # 4-tier recheck engine
│   │   │   ├── website_intel_service.py # Playwright crawling
│   │   │   ├── ai_investigation_service.py # LLM risk reports
│   │   │   ├── risk_scoring_service.py # Trust score computation
│   │   │   └── gstin_service.py    # PAN/GSTIN/CIN validators
│   │   ├── workers/
│   │   │   ├── scheduler.py        # APScheduler background jobs
│   │   │   └── notification_queue.py # Async notification worker
│   │   └── seed/                   # Demo data seeding
│   ├── mcp_server.py              # MCP server for AI agents
│   ├── Dockerfile                 # Playwright-based container
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx               # Landing page
│   │   ├── admin/                 # Admin dashboard
│   │   │   ├── page.tsx           # Merchant listing
│   │   │   ├── merchants/[id]/    # Merchant detail view
│   │   │   ├── rechecks/          # Recheck management
│   │   │   └── diff/[merchantId]/ # Website drift viewer
│   │   ├── merchant/register/     # Onboarding form + pipeline viz
│   │   ├── architecture/          # Interactive HLD diagram
│   │   ├── mcp/                   # MCP documentation
│   │   │   └── simulator/         # Interactive MCP simulator
│   │   └── layout.tsx             # Root layout with fonts
│   ├── components/
│   │   ├── Shell.tsx              # App shell with nav
│   │   ├── VerificationGraph.tsx  # Pipeline visualization
│   │   └── ui/                    # Reusable UI components
│   └── lib/
│       └── api.ts                 # API client with types
│
└── README.md
```

---

## Getting Started

### Prerequisites
- Python 3.12+
- Node.js 18+
- npm or yarn

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium         # Required for website crawling

# Copy and configure environment variables
cp .env.example .env

# Start the server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000" > .env.local

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Database connection string (default: `sqlite:///./sentinelpay.db`) |
| `SEED_DEMO_DATA` | No | Set `true` to populate demo merchants on startup |
| `GROQ_API_KEY` | No | Groq API key for fast LLM reports |
| `GROQ_MODEL` | No | Groq model name (default: `llama-3.3-70b-versatile`) |
| `OPENAI_API_KEY` | No | OpenAI API key (fallback LLM) |
| `OPENAI_MODEL` | No | OpenAI model (default: `gpt-4o-mini`) |
| `RAZORPAY_KEY_ID` | No | Razorpay partner credentials |
| `RAZORPAY_KEY_SECRET` | No | Razorpay partner credentials |
| `META_AD_LIBRARY_TOKEN` | No | Meta Ad Library API token |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE` | Yes | Backend API URL (e.g., `http://127.0.0.1:8000`) |

---

## Deployment

### Backend (Render)
1. Create a new **Web Service** on Render
2. Set the **Root Directory** to `backend`
3. Set the **Dockerfile Path** to `./Dockerfile`
4. Add environment variables in Render dashboard
5. Deploy

### Frontend (Vercel)
1. Import the repository on Vercel
2. Set the **Root Directory** to `frontend`
3. Add `NEXT_PUBLIC_API_BASE` environment variable pointing to your Render URL
4. Deploy

---

## Test Flows

| Flow | URL | Description |
|---|---|---|
| **Merchant Onboarding** | `/merchant/register` | Fill the form and watch the 17-step pipeline execute in real-time |
| **Admin Dashboard** | `/admin` | View all merchants, trust scores, and risk levels |
| **Merchant Details** | `/admin/merchants/:id` | Deep-dive into a specific merchant's verification data |
| **Recheck Management** | `/admin/rechecks` | View, trigger, and inspect 4-tier recheck results |
| **Website Drift** | `/admin/diff/:id` | Compare baseline vs. current website content |
| **MCP Documentation** | `/mcp` | Learn how to set up Claude Desktop integration |
| **MCP Simulator** | `/mcp/simulator` | Run a live AI onboarding demo in the browser |
| **Architecture** | `/architecture` | Interactive system architecture diagram |

---

## Screenshots

### Landing Page
The home page with a clean, professional design showcasing the AI agents and tech capabilities.

### Onboarding Pipeline
Real-time visualization of all 17 verification steps executing as the merchant watches.

### Admin Dashboard
Overview of all merchants with trust scores, risk levels, and status indicators.

### MCP Simulator
Interactive Claude-style chat interface that demonstrates autonomous AI onboarding.

### Architecture Diagram
Dynamic SVG-based system architecture with animated data flow paths and hover details.

---

## Author

**Ritik Raj** — [GitHub](https://github.com/ritikraj2425)

---

<p align="center">
  <b>Built with love for Razorpay Hackathon 2025</b>
</p>
