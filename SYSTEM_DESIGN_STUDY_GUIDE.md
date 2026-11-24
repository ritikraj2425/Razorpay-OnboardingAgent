# SentinelPay: System Design & Object-Oriented Architecture Master Guide

> **Presentation & Interview Handbook**  
> **Project:** SentinelPay (Razorpay Autonomous Merchant Onboarding & Continuous Risk Agent)  
> **Target Audience:** System Design Evaluators, Technical Interviewers, and Project Reviewers  

---

## 1. Project Overview & 60-Second Elevator Pitch

### The Core Problem
In payment aggregators (like Razorpay, Stripe, or Cashfree):
1. **Day-0 Onboarding Latency:** Manual risk underwriting takes **3 to 5 business days**, causing high merchant drop-off.
2. **Day-N "Bait-and-Switch" Attacks:** Merchants get approved selling benign goods (e.g., clothing), then secretly pivot overnight to illegal goods (counterfeit items, drugs, gambling) or spoof payment checkouts.

### The SentinelPay Solution
SentinelPay solves both problems through an autonomous event-driven architecture:
- **Instant Day-0 Underwriting:** An automated 17-step asynchronous pipeline that cross-verifies government registries (PAN, GSTIN, CIN, Bank IFSC), crawls live websites with headless browsers (Playwright), and generates structured underwriter memos using LLMs (Groq LPU / OpenAI) in **under 30 seconds**.
- **Continuous 4-Tier Recheck Engine:** A cost-optimized **Chain-of-Responsibility** monitoring engine that short-circuits checks mathematically (HTTP Ping → SHA-256 Byte Diff → Vector Semantic Distance → LLM Deep Audit), auto-adjusting daily settlement payout limits to contain fraud without incurring runaway AI API bills.

---

## 2. High-Level Design (HLD) Architecture

### System Architecture Diagram (Text / ASCII View)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT LAYER                                    │
│  Next.js 16 Web Dashboard (Merchant Registration & Admin Observability)     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP POST /register (Payload)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GATEWAY & INTAKE LAYER                             │
│  FastAPI REST Gateway (Port 8000)                                           │
│  - Validates payload with Pydantic                                          │
│  - Inserts Shell record into DB (status = 'PROCESSING')                     │
│  - Returns '202 Accepted' immediately to client                             │
└──────────────┬──────────────────────────────────────────────┬───────────────┘
               │ 1. Enqueue Task                              │ 2. Read/Write
               ▼                                              ▼
┌──────────────────────────────┐              ┌───────────────────────────────┐
│     MESSAGE BROKER           │              │      DATABASE LAYER           │
│  RabbitMQ (AMQP)             │              │  PostgreSQL / SQLite          │
│  - Queue: onboarding_tasks   │              │  (SQLAlchemy ORM)             │
│  - Queue: recheck_tasks      │              │  - merchants                  │
│  - Queue: notification_events│              │  - merchant_snapshots        │
└──────────────┬───────────────┘              │  - ai_reports & risk_signals  │
               │                              └───────────────▲───────────────┘
               │ Consume Tasks                                │
               ▼                                              │ Write Results
┌─────────────────────────────────────────────────────────────┴───────────────┐
│                       DISTRIBUTED WORKER LAYER                              │
│  Celery Distributed AI Workers (Python)                                     │
│                                                                             │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────────┐ │
│  │ 1. KYB Verification   │  │ 2. Web Intelligence   │  │ 3. AI Risk Memo │ │
│  │    PAN, GST, CIN,     │  │    Playwright Crawler,│  │    Groq LPU /   │ │
│  │    Bank IFSC Cross-Val│  │    DOM text extraction│  │    OpenAI GPT-4o│ │
│  └───────────────────────┘  └───────────────────────┘  └─────────────────┘ │
└──────────────┬──────────────────────────────────────────────────────────────┘
               │ Emit Decision Event
               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      NOTIFICATION MICROSERVICE                              │
│  Node.js Event Consumer (amqplib + Nodemailer)                              │
│  - Listens to 'notification_events' queue                                   │
│  - Compiles HTML templates and sends instant status alerts to merchant      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### System Architecture Flowchart (Mermaid View)

```mermaid
flowchart TD
    UI["Next.js Web App\n(Port 3000)"]
    API["FastAPI Gateway\n(Port 8000)"]
    DB[("Database\n(PostgreSQL/SQLite)")]
    Q_ONBOARD[("RabbitMQ Queue\nonboarding_tasks")]
    Q_RECHECK[("RabbitMQ Queue\nrecheck_tasks")]
    Q_NOTIF[("RabbitMQ Queue\nnotification_events")]
    WORKER["Celery AI Worker\nPool"]
    CRON["APScheduler\nPeriodic Sweeper"]
    NODE["Node.js Notification\nService"]

    UI -->|"1. Submit Form"| API
    API -->|"2. Write status=PROCESSING"| DB
    API -->|"3. Enqueue Task (202 Accepted)"| Q_ONBOARD
    UI -.->|"Polling Status"| API

    Q_ONBOARD -->|"4. Consume Task"| WORKER
    WORKER -->|"5. Execute 17-step pipeline"| WORKER
    WORKER -->|"6. Save Decision & Score"| DB
    WORKER -->|"7. Publish Decision Event"| Q_NOTIF

    CRON -->|"Trigger due merchants"| Q_RECHECK
    Q_RECHECK -->|"Execute 4-tier cascade"| WORKER

    Q_NOTIF -->|"8. Consume Event"| NODE
    NODE -->|"9. Send Email to Merchant"| UI
```

---

## 3. Low-Level Design (LLD): Class Diagrams & OOP Architecture

To make the class structure clean and easy to read, the object-oriented design is broken down into **4 clear, modular sub-diagrams**.

---

### 3.1 Whiteboard Quick-Draw Reference

> [!TIP]
> **If the interviewer asks: "Can you draw the class diagram on the whiteboard?"**  
> Sketch this simple, clean 3-part box layout:
>
> ```text
> ┌──────────────────────────────────────────────┐
> │             <<abstract>> BaseAgent           │
> │  + name: str, description: str               │
> │  + run(*args): AgentResult   [Template Method]│
> │  # _execute(*args)*: Any                     │
> └───────────────────────▲──────────────────────┘
>                         │ inherits
>     ┌───────────────────┼───────────────────┐
>     │                   │                   │
> ┌───┴─────────────┐ ┌───┴─────────────┐ ┌───┴─────────────┐
> │ DocumentAgent   │ │ WebsiteRiskAgent│ │ DriftAgent      │
> └─────────────────┘ └─────────────────┘ └─────────────────┘
>
> ┌──────────────────────────────────────────────┐
> │           <<interface>> LLMStrategy          │
> │  + generate_report(prompt)*: AIReport        │
> └───────────────────────▲──────────────────────┘
>                         │ implements
>     ┌───────────────────┼───────────────────┐
>     │                   │                   │
> ┌───┴─────────────┐ ┌───┴─────────────┐ ┌───┴─────────────┐
> │ GroqLLMStrategy │ │ OpenAILLMStrategy│ │ RuleBasedFallback│
> └─────────────────┘ └─────────────────┘ └─────────────────┘
>
> ┌──────────────────────────────────────────────┐
> │        <<abstract>> RecheckTierHandler       │
> │  - next_handler: RecheckTierHandler          │
> │  + set_next(handler): RecheckTierHandler     │
> │  + handle(ctx: RecheckContext): RecheckCtx   │
> └───────────────────────▲──────────────────────┘
>                         │ implements (Chain of Resp.)
>     ┌───────────┬───────┴───────────┬───────────┐
>     ▼           ▼                   ▼           ▼
> ┌────────┐  ┌──────────┐      ┌───────────┐ ┌───────────┐
> │ Tier 1 │─►│  Tier 2  │─────►│  Tier 3   │─► Tier 4    │
> │ (Ping) │  │(SHA Hash)│      │(Cosine TF)│ │(LLM Audit)│
> └────────┘  └──────────┘      └───────────┘ └───────────┘
> ```

---

### 3.2 Diagram A: Agent Framework (Inheritance & Template Method Pattern)

Implemented in `backend/app/agents/base.py` and specialized agents.

```mermaid
classDiagram
    class BaseAgent {
        <<abstract>>
        +str name
        +str description
        +run(*args, **kwargs) AgentResult
        #_execute(*args, **kwargs)* Any
    }

    class AgentResult {
        +bool success
        +Any output
        +int execution_time_ms
        +str error
        +dict metadata
    }

    class DocumentConsistencyAgent {
        #_execute(business_name, document_name) bool
    }

    class WebsiteRiskAgent {
        #_execute(url, policy_urls) WebsiteIntel
    }

    class DriftDetectionAgent {
        #_execute(baseline_text, current_text) float
    }

    class UnderwriterReportAgent {
        #_execute(merchant_name, trigger, source_text, source_url, kyc_data) AIInvestigationReport
    }

    class AdPolicyMismatchAgent {
        #_execute(ad, website_price_summary, policy_text) list
    }

    BaseAgent <|-- DocumentConsistencyAgent : Inherits
    BaseAgent <|-- WebsiteRiskAgent : Inherits
    BaseAgent <|-- DriftDetectionAgent : Inherits
    BaseAgent <|-- UnderwriterReportAgent : Inherits
    BaseAgent <|-- AdPolicyMismatchAgent : Inherits
    BaseAgent ..> AgentResult : Returns
```

- **Abstraction:** `BaseAgent` defines the abstract interface via `@abstractmethod def _execute()`.
- **Template Method Pattern:** `BaseAgent.run()` encapsulates invariant execution logic (timer start, exception handling, logging, metadata wrapping) while delegating variant logic to `_execute()`.

---

### 3.3 Diagram B: Strategy Pattern (LLM & Payment Gateway)

Implemented in `backend/app/services/ai_investigation_service.py` and `backend/app/services/payment_provider_service.py`.

```mermaid
classDiagram
    class LLMStrategy {
        <<interface>>
        +generate_report(merchant_name, trigger, source_text, source_url, kyc_data)* AIInvestigationReport
    }

    class OpenAIBasedLLMStrategy {
        +str api_key
        +str model
        +str base_url
        +generate_report(...) AIInvestigationReport
    }

    class GroqLLMStrategy {
        +GroqLLMStrategy()
    }

    class OpenAILLMStrategy {
        +OpenAILLMStrategy()
    }

    class RuleBasedFallbackStrategy {
        +generate_report(...) AIInvestigationReport
    }

    class AIInvestigationContext {
        -list strategies
        +investigate(...) AIInvestigationReport
    }

    LLMStrategy <|-- OpenAIBasedLLMStrategy : Implements
    OpenAIBasedLLMStrategy <|-- GroqLLMStrategy : Inherits
    OpenAIBasedLLMStrategy <|-- OpenAILLMStrategy : Inherits
    LLMStrategy <|-- RuleBasedFallbackStrategy : Implements
    AIInvestigationContext o-- LLMStrategy : Aggregates

    class PaymentGatewayStrategy {
        <<interface>>
        +activate_merchant(merchant_id)* ProviderActivation
        +calculate_payout_limit(current, risk_level)* float
    }

    class RazorpayPaymentStrategy {
        +activate_merchant(merchant_id) ProviderActivation
        +calculate_payout_limit(current, risk_level) float
    }

    class MockPaymentStrategy {
        +activate_merchant(merchant_id) ProviderActivation
        +calculate_payout_limit(current, risk_level) float
    }

    class PaymentGatewayContext {
        -PaymentGatewayStrategy strategy
        +activate(merchant_id) ProviderActivation
        +adjust_limit(current, risk_level) float
    }

    PaymentGatewayStrategy <|-- RazorpayPaymentStrategy : Implements
    PaymentGatewayStrategy <|-- MockPaymentStrategy : Implements
    PaymentGatewayContext o-- PaymentGatewayStrategy : Aggregates
```

- **Polymorphism:** `AIInvestigationContext` executes `strategy.generate_report(...)` uniformly without coupling to Groq, OpenAI, or the offline heuristic fallback.
- **Open-Closed Principle:** New payment providers (e.g. Stripe, PayU) can be added by implementing `PaymentGatewayStrategy` without modifying existing registration code.

---

### 3.4 Diagram C: Chain of Responsibility (4-Tier Continuous Recheck)

Implemented in `backend/app/services/recheck_chain.py` and `backend/app/services/recheck_orchestrator.py`.

```mermaid
classDiagram
    class RecheckTierHandler {
        <<abstract>>
        #RecheckTierHandler next_handler
        +set_next(handler) RecheckTierHandler
        +handle(ctx) RecheckContext
        #_process(ctx)* bool
    }

    class Tier1AvailabilityHandler {
        #_process(ctx) bool
    }

    class Tier2HashDiffHandler {
        #_process(ctx) bool
    }

    class Tier3SemanticDriftHandler {
        #_process(ctx) bool
    }

    class Tier4LLMInvestigationHandler {
        #_process(ctx) bool
    }

    class RecheckContext {
        +Session db
        +Merchant merchant
        +str trigger_reason
        +int tier_reached
        +str status
        +float cost_saved
        +bool halted
    }

    RecheckTierHandler <|-- Tier1AvailabilityHandler
    RecheckTierHandler <|-- Tier2HashDiffHandler
    RecheckTierHandler <|-- Tier3SemanticDriftHandler
    RecheckTierHandler <|-- Tier4LLMInvestigationHandler
    RecheckTierHandler --> RecheckTierHandler : next_handler
    RecheckTierHandler ..> RecheckContext : Mutates state
```

---

### 3.5 Diagram D: Database Schema & Entity Relationships (ORM Layer)

Implemented in `backend/app/models/`.

```mermaid
erDiagram
    MERCHANT ||--o{ MERCHANT_SNAPSHOT : "has snapshots"
    MERCHANT ||--o{ VERIFICATION : "has verifications"
    MERCHANT ||--o{ AI_REPORT : "has reports"
    MERCHANT ||--o{ RISK_SIGNAL : "has signals"
    MERCHANT ||--o{ RECHECK_JOB : "has jobs"
    MERCHANT ||--o{ HUMAN_REVIEW_CASE : "has review cases"

    MERCHANT {
        int id PK
        string legal_business_name
        string pan
        string gst
        string status
        int trust_score
        string risk_level
        float payout_limit
        text onboarding_steps
    }

    MERCHANT_SNAPSHOT {
        int id PK
        int merchant_id FK
        string kind
        string html_hash
        text website_text
        float semantic_drift_score
    }

    AI_REPORT {
        int id PK
        int merchant_id FK
        int risk_score
        string risk_level
        string decision_recommendation
        text underwriter_memo
    }

    RECHECK_JOB {
        int id PK
        int merchant_id FK
        string trigger_reason
        int tier_reached
        string status
        float cost_saved
    }
```

---

## 4. UML Sequence Diagrams

### 4.1 Sequence Diagram: Day-0 Asynchronous Onboarding Flow

```mermaid
sequenceDiagram
    autonumber
    actor Merchant as Merchant
    participant UI as Next.js Web App
    participant API as FastAPI Gateway
    participant DB as Database (SQLAlchemy)
    participant Q as RabbitMQ (onboarding_tasks)
    participant Worker as Celery AI Worker
    participant KYC as Registry APIs (PAN/GST/IFSC)
    participant Scraper as Playwright Scraper
    participant AI as LLM Strategy Context

    Merchant ->> UI: Fill KYB form & submit
    UI ->> API: POST /api/merchants/register
    API ->> DB: Insert merchant (status="PROCESSING")
    API ->> Q: process_onboarding.delay(merchant_id)
    API -->> UI: 202 Accepted {id: 42, status: "PROCESSING"}

    Note over UI, API: Long-Polling GET /api/merchants/42/status every 2s

    Q ->> Worker: Consume onboarding task
    Worker ->> KYC: Steps 3-8: Validate PAN, GSTIN, CIN, IFSC
    KYC -->> Worker: Identity verified
    Worker ->> Scraper: Step 11: Crawl website & extract policies
    Scraper -->> Worker: DOM text & baseline HTML hash
    Worker ->> Worker: Steps 15-16: Compute Trust Score (0-100)

    alt Score < 85 (Flagged / Borderline)
        Worker ->> AI: Step 17: generate_risk_report() via LLM Strategy
        AI -->> Worker: AIInvestigationReport (Memo + Confidence)
    end

    Worker ->> DB: Save final decision, baseline snapshot, and steps
    Worker -->> Q: Publish notification event
```

---

### 4.2 Sequence Diagram: 4-Tier Continuous Recheck (Bait & Switch Prevention)

```mermaid
sequenceDiagram
    autonumber
    participant Cron as APScheduler
    participant Q as RabbitMQ (recheck_tasks)
    participant Worker as Celery Recheck Worker
    participant T1 as Tier 1: Ping Check
    participant T2 as Tier 2: SHA-256 Hash
    participant T3 as Tier 3: Vector Cosine
    participant T4 as Tier 4: LLM Audit
    participant DB as Database
    participant GW as PaymentGatewayContext

    Cron ->> Q: Schedule recheck task for due merchant
    Q ->> Worker: Consume recheck job
    Worker ->> T1: handle(ctx) -> Ping website domain

    alt Site Down (HTTP 404 / 500)
        T1 ->> DB: Status: SERVICE_UNREACHABLE
        T1 -->> Worker: [HALT EARLY] Cost: $0
    end

    T1 ->> T2: handle(ctx) -> Compare HTML SHA-256 with Baseline
    alt Hash Matches Baseline Exactly
        T2 ->> DB: Status: NO_CHANGE, Cost saved: $0.08
        T2 -->> Worker: [HALT EARLY] Cost: $0, Time: ~1ms
    end

    T2 ->> T3: handle(ctx) -> Compute Cosine Distance
    alt Cosine Distance < 0.10 (Cosmetic formatting only)
        T3 ->> DB: Status: COMPLETED, Cost saved: $0.05
        T3 -->> Worker: [HALT EARLY] Cost: $0, Time: ~2ms
    end

    T3 ->> T4: handle(ctx) -> Severe Drift (> 0.25) or Traffic Spike
    T4 ->> T4: Run LLM Investigation Strategy (Groq/OpenAI)
    T4 ->> DB: Save AIReport & create HumanReviewCase

    alt Bait & Switch / Illicit Goods Detected
        T4 ->> GW: lower_payout_limit(current_limit, "critical")
        GW -->> T4: Payout limit lowered to ₹10,000
        T4 ->> DB: Status: RESTRICTED
    end
    T4 -->> Worker: [CHAIN COMPLETED]
```

---

## 5. State Machine Diagram: Merchant Lifecycle

```mermaid
stateDiagram-v2
    [*] --> PROCESSING: Merchant Registers via API

    state PROCESSING {
        [*] --> KYC_VALIDATION
        KYC_VALIDATION --> DOM_CRAWL
        DOM_CRAWL --> TRUST_SCORING
        TRUST_SCORING --> AI_UNDERWRITING: Score < 85
    }

    PROCESSING --> APPROVED: Score >= 85 (Low Risk)
    PROCESSING --> PENDING_REMEDIATION: Score 60-84 (Missing Policy / Incomplete KYC)
    PROCESSING --> MANUAL_REVIEW: Score 40-59 (Borderline Signals)
    PROCESSING --> REJECTED: Score < 40 (Prohibited Goods / Fake Registry)

    PENDING_REMEDIATION --> APPROVED: Merchant uploads missing docs within 48h
    PENDING_REMEDIATION --> REJECTED: Deadline Expired

    MANUAL_REVIEW --> APPROVED: Human Underwriter Approves
    MANUAL_REVIEW --> REJECTED: Human Underwriter Rejects

    state PostOnboardingMonitoring {
        APPROVED --> RESTRICTED: Recheck Tier 4 flags severe drift or transaction spike
        APPROVED --> SUSPENDED: Confirmed fraudulent activity
        RESTRICTED --> APPROVED: Review cleared by underwriter
        RESTRICTED --> SUSPENDED: Review confirms fraud
    }

    SUSPENDED --> [*]
    REJECTED --> [*]
```

---

## 6. Design Patterns Summary Table

| Pattern | Type | File Location | Purpose in SentinelPay |
| :--- | :--- | :--- | :--- |
| **Strategy Pattern** | Behavioral | `app/services/ai_investigation_service.py` | Encapsulates LLM invocation algorithms (`GroqLLMStrategy`, `OpenAILLMStrategy`, `RuleBasedFallbackStrategy`). Swaps models dynamically. |
| **Strategy Pattern** | Behavioral | `app/services/payment_provider_service.py` | Decouples payment processors (`RazorpayPaymentStrategy`, `MockPaymentStrategy`) from underwriting decisions. |
| **Strategy Pattern** | Behavioral | `app/services/risk_scoring_service.py` | Modular risk rule strategies (`KYCRuleStrategy`, `BankingRuleStrategy`, `CompliancePolicyRuleStrategy`). |
| **Chain of Responsibility** | Behavioral | `app/services/recheck_chain.py` | Cascades the 4-tier recheck sequentially. Each tier short-circuits early if no drift is found, saving >95% LLM API costs. |
| **Template Method** | Behavioral | `app/agents/base.py` | `BaseAgent.run()` enforces common timing, error handling, and telemetry, delegating business logic to abstract `_execute()`. |
| **Observer (Pub-Sub)** | Behavioral | `app/workers/pika_publisher.py` | Emits asynchronous AMQP events on RabbitMQ queues, consumed by the Node.js notification microservice. |
| **Facade Pattern** | Structural | `app/services/merchant_service.py` | Provides simple top-level functions (`create_merchant`, `run_recheck`) that hide complex multi-class orchestrations. |

---

## 7. OOP Pillars in SentinelPay

| OOP Pillar | Definition | How SentinelPay Demonstrates It (Code Reference) |
| :--- | :--- | :--- |
| **Abstraction** | Hiding complex internals behind clean interfaces. | `LLMStrategy(ABC)`, `BaseAgent(ABC)`, and `PaymentGatewayStrategy(ABC)` define contracts using `@abstractmethod`. Callers do not know low-level HTTP details. |
| **Inheritance** | Deriving child classes from a parent class to reuse code. | `GroqLLMStrategy` inherits from `OpenAIBasedLLMStrategy`, which inherits from `LLMStrategy`. All 5 agents inherit from `BaseAgent`. All database models inherit from `declarative_base()`. |
| **Polymorphism** | Calling the same method signature on different classes producing different behaviors. | Calling `strategy.generate_report(...)` dynamically invokes Groq's API, OpenAI's API, or the offline heuristic engine. Calling `handler.handle(ctx)` processes different tier logic through a uniform interface. |
| **Encapsulation** | Keeping data and mutating methods together while protecting state. | Dataclasses `RecheckContext`, `AgentResult`, and `ProviderActivation` encapsulate mutation state. Pydantic models validate and constrain fields before business logic executes. |

---

## 8. Top 5 System Design Interview Q&As

### Q1: Why did you choose an Asynchronous Architecture (FastAPI + Celery + RabbitMQ) over synchronous REST?
> **Answer:**  
> "A merchant verification pipeline involves external government registry lookups (MCA CIN, GSTIN portal), dynamic headless browser crawling with Playwright, and LLM text generation. If done synchronously in a single HTTP request:
> 1. The HTTP request would hang for 15–30 seconds, causing gateway timeouts (504 Gateway Timeout) and connection pool exhaustion.
> 2. By returning `202 Accepted` immediately and dispatching tasks to RabbitMQ, the FastAPI gateway handles thousands of requests per second with sub-10ms response times. The client polls status or receives an asynchronous webhook/email notification upon completion."

---

### Q2: What is the technical and economic justification for the 4-Tier Recheck Cascade?
> **Answer:**  
> "If a payment gateway monitors 100,000 active merchants daily using an LLM ($0.005 to $0.02 per crawl), the monthly AI bill alone would exceed $15,000 to $60,000.  
> In reality, 95% of active e-commerce merchants do not change their website policies or product catalog daily.  
> Our 4-Tier Cascade applies **mathematical short-circuiting**:
> - **Tier 1 (Availability Ping, ~100ms, $0):** Verifies the site is reachable.
> - **Tier 2 (SHA-256 Byte Hash, ~1ms, $0):** If not a single byte changed in the HTML DOM compared to baseline, it halts immediately. Filters out ~80% of checks.
> - **Tier 3 (Vector Cosine Distance, ~3ms, $0):** Calculates token frequency cosine distance. If distance < 0.10, the changes are cosmetic formatting. It halts immediately. Filters another ~15%.
> - **Tier 4 (LLM Deep Investigation, ~1500ms, ~$0.005):** Invoked **only for the remaining ~5%** of merchants where genuine semantic drift or fraud spikes occurred.  
> **Result:** >95% cost reduction and sub-millisecond execution for the vast majority of runs."

---

### Q3: How do you prevent LLM Hallucinations in Financial Underwriting?
> **Answer:**  
> "SentinelPay enforces a 4-layer guardrail system:
> 1. **Structured Outputs (Strict JSON Schema):** We use OpenAI/Groq JSON Schema mode (`strict: True`), constraining the LLM to output only typed JSON matching our Pydantic `AIInvestigationReport`.
> 2. **Deterministic Temperature:** Set `temperature=0.0` for repeatable, deterministic risk scoring.
> 3. **Exact Ground-Truth Quoting:** The prompt strictly requires that every high-risk claim copy an exact verbatim quote from the crawled text. In `ai_investigation_service.py`, a post-validation filter automatically discards any evidence quote that does not exist in the source document.
> 4. **Human-in-the-Loop Escalation:** The AI is never permitted to ban a merchant unilaterally; critical findings generate a `HumanReviewCase` for compliance officer sign-off."

---

### Q4: How do you handle Idempotency and Deduplication?
> **Answer:**  
> "1. In `create_merchant()`, before database insertion, deduplication queries check `legal_business_name`, `pan`, and `website_url`. If a duplicate is resubmitted, previous records are cleaned up or updated.  
> 2. RabbitMQ message tasks include merchant IDs; Celery workers use idempotent task boundaries so re-delivered messages do not create duplicate linked accounts in Razorpay."

---

### Q5: How would you scale this system to 1,000,000 merchants?
> **Answer:**  
> "1. **Database Partitioning:** Hash-partition `merchants` and `merchant_snapshots` tables by `merchant_id` across database shards.  
> 2. **Prioritized Queue Sharding:** Separate RabbitMQ queues into `onboarding_high_priority` (Day-0 instant applicants) and `recheck_batch_low_priority` (periodic monitoring).  
> 3. **Vector Database:** For Tier 3 semantic search across millions of snapshots, replace in-memory cosine math with a dedicated vector database (pgvector or Qdrant) with HNSW indexing.  
> 4. **Headless Browser Cluster:** Scale Playwright using a distributed browser grid (e.g. Browserless / Dockerized workers) with proxy rotation to prevent IP blocking."
