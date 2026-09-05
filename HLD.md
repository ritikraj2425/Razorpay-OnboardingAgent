# High Level Design (HLD)

This document outlines the High Level Design for both the **Onboarding Agent** and the **Recheck Agent** in SentinelPay.

---

## 1. Onboarding Agent Flow

This diagram illustrates the step-by-step pipeline of the Day-0 Onboarding Agent. It is modeled as interconnected tables representing the flow of data through the AI verification system.

```text
┌───────────────────────────────────────────────────────────────┐
│                     1. INPUT PHASE                            │
│  [ Merchant Application ] ─────► [ API Gateway (FastAPI) ]    │
└──────────────────────────────────────┬────────────────────────┘
                                       │
┌──────────────────────────────────────▼────────────────────────┐
│                  2. DATA INTAKE & DISPATCH                    │
│                                                               │
│  [ Database: Merchants ] ◄──(Save)── [ FastAPI ]              │
│                                          │                    │
│                                        (Push)                 │
│                                          ▼                    │
│                        [ RabbitMQ: onboarding_tasks ]         │
└──────────────────────────────────────┬────────────────────────┘
                                       │
┌──────────────────────────────────────▼────────────────────────┐
│                   3. ASYNCHRONOUS AI WORKER                   │
│                                                               │
│               [ Celery Worker: process_onboarding ]           │
│                               │                               │
│  ├─► Step 1: Entity Registration & KYC                        │
│  ├─► Step 2: External API Validation (PAN/GSTIN/CIN)          │
│  ├─► Step 3: Playwright Web Scraper                           │
│  ├─► Step 4: Website Intel Parsing                            │
│  ├─► Step 5: LLM Risk Investigator (Groq/Gemini)              │
│  ├─► Step 6: Underwriter Memo Generation                      │
│  └─► Step 7: Trust Score Calculation                          │
│                               │                               │
│                     { Decision Engine }                       │
└──────────────────────────────────────┬────────────────────────┘
                                       │
┌──────────────────────────────────────▼────────────────────────┐
│                     4. RESOLUTION & ALERTS                    │
│                                                               │
│       [ APPROVED ]    [ PENDING_REMEDIATION ]    [ REJECTED ] │
│             │                   │                      │      │
│             └─────────┬─────────┴──────────────────────┘      │
│                       ▼                                       │
│             [ Database Update ]                               │
│                       │                                       │
│             [ RabbitMQ: notification_events ]                 │
│                       │                                       │
│       [ Node.js Notification Service ] ──► (Email Alert)      │
└───────────────────────────────────────────────────────────────┘
```

### Flow Summary:
1. The **Merchant** submits data via the Next.js frontend.
2. The **FastAPI Backend** creates a shell record in the database and pushes the heavy lifting to the `onboarding_tasks` RabbitMQ queue.
3. The **Celery Worker** picks up the task and runs a 17-step pipeline (KYC API calls, Playwright crawling, Groq/Gemini LLM inference, and Trust Scoring).
4. Based on the **Trust Score**, the decision is finalized in the database.
5. An event is emitted to the `notification_events` queue, which triggers the **Node.js microservice** to send a status email.

---

## 2. Recheck Agent Flow

This diagram illustrates the High Level Design of the **4-Tier Recheck Agent** pipeline. It continuously monitors approved merchants post-onboarding.

```text
┌───────────────────────────────────────────────────────────────┐
│                      1. TRIGGER PHASE                         │
│  [ APScheduler ] ──(1, 7, 30 days)──► [ FastAPI /rechecks ]   │
└──────────────────────────────────────┬────────────────────────┘
                                       │
┌──────────────────────────────────────▼────────────────────────┐
│                      2. DATA RETRIEVAL                        │
│                                                               │
│  [ Database: Merchants & Snapshots ] ◄── [ Recheck Orch. ]    │
└──────────────────────────────────────┬────────────────────────┘
                                       │
┌──────────────────────────────────────▼────────────────────────┐
│                    3. RECHECK TIER SYSTEM                     │
│                                                               │
│  [ Tier 1: Availability Check (HTTP Ping) ]                   │
│       │                                                       │
│       ├─ (Fails) ─────► [ Log & Escalate ]                    │
│       │                                                       │
│       ▼ (Passes)                                              │
│  [ Tier 2: Content Drift Detection (SHA-256) ]                │
│       │                                                       │
│       ├─ (Matches) ───► [ Log: No Change ]                    │
│       │                                                       │
│       ▼ (Differs)                                             │
│  [ Tier 3: Semantic Analysis (Vector Distance) ]              │
│       │                                                       │
│       ├─ (<= 0.2) ────► [ Log: Minor Changes ]                │
│       │                                                       │
│       ▼ (> 0.2)                                               │
│  [ Tier 4: Full AI Investigation (Playwright + LLM) ]         │
└──────────────────────────────────────┬────────────────────────┘
                                       │
┌──────────────────────────────────────▼────────────────────────┐
│               4. AI RE-EVALUATION & ESCALATION                │
│                                                               │
│  [ Web Scraper crawls new content ]                           │
│                       │                                       │
│  [ LLM compares against Baseline Profile ]                    │
│                       │                                       │
│                  { Escalation Engine }                        │
│                       │                                       │
│        [ Status: SUSPENDED ] OR [ Create Review Case ]        │
└──────────────────────────────────────┬────────────────────────┘
                                       │
┌──────────────────────────────────────▼────────────────────────┐
│                     5. NOTIFICATION ALERTS                    │
│                                                               │
│             [ RabbitMQ: notification_events ]                 │
│                       │                                       │
│       [ Node.js Notification Service ] ──► (Email Alert)      │
└───────────────────────────────────────────────────────────────┘
```

### Flow Summary:
1. **APScheduler** runs background jobs continuously, picking merchants based on their dynamic risk profile.
2. The **Recheck Orchestrator** pulls the latest snapshot of the merchant's website.
3. The checks cascade from cheap (HTTP Ping, SHA hash) to expensive (Vector Similarity, LLM Re-evaluation) to save API costs.
4. If a severe violation is found (e.g., pivot to selling illegal goods), the merchant is **Suspended**.
5. Notifications and review cases are generated dynamically.
