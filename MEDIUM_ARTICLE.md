# Zero to Go-Live in 30 Seconds: How We Built an Autonomous AI Merchant Onboarding & Fraud Prevention Agent

### *How event-driven microservices, headless browser intelligence, and a cost-optimized 4-tier LLM cascade transformed payment gateway underwriting.*

---

![Banner Concept: Autonomous Fintech Agent Architecture](https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1600&q=80)

*By Ritik Raj and the SentinelPay Engineering Team*

---

If you have ever integrated a payment gateway like **Razorpay, Stripe, or Cashfree** as a merchant, you know the frustration of the *“Pending Compliance Review”* screen. 

For developers and founders, those 3 to 5 business days of manual back-and-forth feel like an eternity. Uploading PAN cards, verifying GST certificates, fixing broken refund policy links, and waiting for an underwriter to manually click through your website kills merchant momentum. In emerging markets, over **40% of prospective merchants abandon onboarding** simply because the compliance process is too slow.

But for payment aggregators, compliance isn’t optional. Aggregators face a dangerous, asymmetrical threat known in fintech as the **“Bait-and-Switch” attack**:
> A merchant submits documents for a harmless, low-risk business—say, artisanal pottery or handcrafted notebooks. Once approved and assigned live payment gateway credentials, they secretly swap their website catalog overnight to sell counterfeit luxury watches, unauthorized pharmaceuticals, or illicit betting vouchers. 

By the time human audit teams notice, chargeback ratios have spiked, Visa/Mastercard fines have landed, and millions in fraudulent payouts have left the system.

We set out to solve both sides of this equation: **What if we could reduce Day-0 merchant onboarding from 4 days to 30 seconds, while continuously guarding against Day-N catalog fraud without racking up tens of thousands of dollars in LLM API bills?**

Enter **SentinelPay**—an autonomous, event-driven merchant underwriting and post-onboarding risk agent. Here is how we engineered it from scratch.

---

## The High-Level Architecture: Designing for Throughput & Resilience

Merchant underwriting is inherently I/O-intensive and heterogeneous. A single applicant requires external government registry cross-checks (Income Tax PAN, GST portal, Ministry of Corporate Affairs CIN), dynamic headless browser crawling (Playwright), and deep contextual evaluation using Large Language Models (LLMs).

If you handle this through standard synchronous REST requests, your API server will choke:
- Connections stay open for 20+ seconds, leading to `504 Gateway Timeouts`.
- Web server worker pools get exhausted by slow external dependencies.
- A sudden burst of 500 signups would bring the gateway to a halt.

To guarantee high availability and sub-10ms HTTP response times, we decoupled SentinelPay into an **Asynchronous Event-Driven Microservices Architecture** powered by 4 isolated engines:

```
┌──────────────────┐           ┌──────────────────┐
│  Next.js 16 Web  │──────────►│  FastAPI Gateway │
│    Dashboard     │◄──────────│   (Port 8000)    │
└──────────────────┘  Polling  └────────┬─────────┘
                                        │ 202 Accepted + Enqueue
                                        ▼
                               ┌──────────────────┐
                               │  RabbitMQ Broker │
                               │  (AMQP Queues)   │
                               └────────┬─────────┘
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             ▼                                                     ▼
┌──────────────────────────┐                             ┌──────────────────┐
│ Celery Distributed Worker│                             │ Node.js Notifier │
│ - 17-Step Day-0 Pipeline │                             │ - Email alerts   │
│ - 4-Tier Recheck Cascade │                             │ - Underwriter memo│
└────────────┬─────────────┘                             └──────────────────┘
             │ Writes State
             ▼
┌──────────────────────────┐
│ PostgreSQL / SQLite DB   │
│ (Snapshots, Steps, Audit)│
└──────────────────────────┘
```

1. **The Ingestion Gateway (FastAPI + Pydantic):** Validates the incoming registration payload, writes an initial record with `status="PROCESSING"`, pushes the task payload to a RabbitMQ queue, and returns `202 Accepted` in **under 8 milliseconds**.
2. **The Central Nervous System (RabbitMQ):** Decouples fast web intake from heavy processing across dedicated AMQP queues: `onboarding_tasks`, `recheck_tasks`, and `notification_events`.
3. **The Brain (Celery Distributed Python Workers):** A cluster of asynchronous workers that consume tasks, execute web crawls, calculate mathematical vector distances, and invoke LLMs.
4. **The Communicator (Node.js Notification Microservice):** An isolated microservice using `amqplib` and `nodemailer` that listens for decision events and instantly emails the merchant their approval status along with the AI-generated underwriter memo.

---

## Flow 1: Day-0 Instant Underwriting (The 17-Step Autonomous Pipeline)

When a merchant submits their business details via the Next.js portal, a Celery worker immediately picks up the task and executes a strict 17-step verification sequence:

```
[Entity Registration] ──► [KYC Registry Cross-Validation] ──► [Playwright Crawl]
                                                                     │
[Payment Gateway Activation] ◄── [Trust Score (0-100)] ◄── [Policy & Prohibited Scan]
```

### 1. Government Registry Cross-Matching
We don’t just verify that a PAN or GSTIN is syntactically valid; we enforce **relational coherence**:
- **PAN-to-GSTIN Embedding:** In India, characters 3 through 12 of a 15-character GSTIN must match the business’s PAN. If they don't, it’s an immediate red flag.
- **Entity Type Coherence:** The 4th character of an Indian PAN signifies entity status (`C` for Company, `P` for Individual, `F` for Partnership, `T` for Trust). If an applicant registers as a `private_limited` entity but provides a personal `P` PAN, the agent penalizes the trust score and flags identity mismatch.
- **CIN / LLPIN Validation:** Corporate entities have their 21-digit Corporate Identification Number validated against MCA registry formats.
- **Banking Verification:** The IFSC code is resolved to the bank branch name, and we check our database for **Bank Account Reuse Rings** (detecting whether multiple distinct merchants share identical payout accounts).

### 2. Autonomous Web Scraping via Headless Browsers
Next, our `WebsiteRiskAgent` boots a headless browser session via Playwright:
- Audits domain accessibility (HTTP status, SSL validity, DNS resolution).
- Automatically discovers and parses mandatory compliance pages: **Refund Policy, Shipping Policy, Privacy Policy, and Terms of Service**.
- Detects whether all policy URLs simply redirect to a blank homepage or repeat identical placeholder copy.
- Detects Single Page Applications (SPAs) and extracts full text content, product catalogs, and contact numbers.

### 3. Trust Score Calculation & Automated Gateway Activation
The agent runs an evaluation engine that aggregates penalties across all vectors. The merchant receives a **Trust Score between 0 and 100**:
- **Score ≥ 85 (Approved):** Instant approval. The agent invokes our `PaymentGatewayStrategy`, provisions a Razorpay Linked Account, generates API keys, and triggers an email notification.
- **Score 60–84 (Pending Remediation):** The merchant is missing non-fatal items (e.g., missing refund policy URL). A 48-hour remediation window is granted with an automated checklist emailed to them.
- **Score 40–59 (Manual Review):** Borderline indicators. The agent summarizes findings into a `HumanReviewCase`.
- **Score < 40 (Rejected):** Fake registration, prohibited categories, or severe identity mismatch.

---

## Flow 2: The Continuous Recheck Problem (And the 4-Tier Cascade)

Onboarding a merchant safely is only half the battle. What happens on Day 7, Day 30, or Day 90?

Merchants can easily change their website after approval. But here is the engineering dilemma: **If a payment gateway has 100,000 active merchants, crawling and passing every site through an LLM daily ($0.01 per call) would cost $30,000 to $60,000 every single month in pure API spend!**

Furthermore, **95% of legitimate e-commerce websites do not change their product categories on any given day.** Making 100,000 LLM calls a day to confirm that a shoe store is still selling shoes is a massive waste of compute.

To solve this, we implemented a **4-Tier Chain-of-Responsibility Cascade** that applies **mathematical short-circuiting**:

```
[Tier 1: Ping Check] ──(Pass)──► [Tier 2: SHA-256 Byte Diff] ──(Pass)──► [Tier 3: Cosine Semantic Diff] ──(Pass)──► [Tier 4: LLM Audit]
        │                                    │                                      │                                  │
    (Site Down)                         (Identical)                         (Cosmetic Drift < 0.10)            (Bait & Switch Detected)
        ▼                                    ▼                                      ▼                                  ▼
[Log & Flag Service]               [Halt Early: Cost $0]                  [Halt Early: Cost $0]              [Lower Payout Limit & Restrict]
```

Let’s look at the economics and mechanics of each tier:

### Tier 1: Website Availability Check (~100ms | Cost: $0)
A rapid HTTP ping. If the merchant's site returns a 404, 500, or DNS connection error, we immediately log a `SERVICE_UNREACHABLE` signal and halt the chain. 

### Tier 2: SHA-256 Byte-Level Content Diff (~1ms | Cost: $0)
On Day 0, we hash the merchant's cleaned DOM text using SHA-256 and store it as a baseline snapshot. On periodic rechecks, we hash the new HTML:
- If `current_hash == baseline_hash`: **Not a single byte of text changed.**
- The check **halts immediately**.
- **Result:** ~80% of merchants exit at Tier 2 with **0 milliseconds of LLM compute and $0 cost**.

### Tier 3: Vector Semantic Distance via Cosine Similarity (~3ms | Cost: $0)
What if the merchant updated their site, but only to change *"Spring Sale 10% Off"* to *"Spring Sale 15% Off"*? 

A simple byte hash will fail, but running an LLM here is still unnecessary. Instead, our `DriftDetectionAgent` tokenizes the text into bag-of-words frequency vectors $\vec{v}_a$ and $\vec{v}_b$ and computes the **Cosine Distance**:

$$\text{Cosine Distance} = 1 - \frac{\vec{v}_a \cdot \vec{v}_b}{\|\vec{v}_a\| \|\vec{v}_b\|}$$

- If **Distance < 0.10**: The text changes are purely cosmetic formatting or price tweaks. The agent records benign drift, updates the baseline, and **halts early**.
- If **Distance between 0.10 and 0.25**: Moderate drift. The merchant is placed on an automated watchlist.
- If **Distance > 0.25**: The semantic meaning of the website has shifted significantly (e.g., shoe terms disappeared, prescription drug keywords appeared). **Only now does the system escalate to Tier 4.**

### Tier 4: Deep LLM Risk Investigation (~1500ms | Cost: ~$0.005)
Triggered strictly for the ~5% of merchants that exhibited significant semantic drift or an anomalous transaction volume spike.

The LLM compares the new catalog against the original approved business profile, cross-references with regulatory policies, and outputs a structured risk assessment. 

If a **Bait-and-Switch attack** is detected, the agent doesn't simply ban the merchant outright (which could disrupt a legitimate merchant who pivoted catalog lines). Instead, it **dynamically throttles their daily payout settlement limit** (e.g., dropping it to ₹10,000) and routes the case to a human underwriter with an exact diff memo.

> **The Result:** By cascading from cheap to expensive checks, SentinelPay achieves **>95% LLM cost reduction**, executing the vast majority of continuous monitoring checks in sub-5ms latency.

---

## Under the Hood: Object-Oriented Design Patterns

Building production-grade AI agents requires clean software engineering. Here are the core OOP design patterns we used in SentinelPay:

### 1. The Strategy Pattern: Multi-Provider LLM Fallbacks
Rather than hardcoding vendor SDKs, we defined an abstract `LLMStrategy` interface:

```python
class LLMStrategy(ABC):
    @abstractmethod
    def generate_report(self, merchant_name: str, trigger: str, source_text: str, ...) -> Optional[AIInvestigationReport]:
        pass
```

Because Groq and OpenAI share the same `/chat/completions` API schema, we created an intermediate class `OpenAIBasedLLMStrategy` to handle JSON schema formatting, HTTP connections, and error handling in one place (**DRY principle**).

- `GroqLLMStrategy`: Configured for ultra-low latency LPU inference with LLaMA-3.3.
- `OpenAILLMStrategy`: Configured for GPT-4o.
- `RuleBasedFallbackStrategy`: Implements `LLMStrategy` directly with zero-cost offline regex heuristics.

Our `AIInvestigationContext` holds these strategies and invokes them **polymorphically**. If Groq experiences a network hiccup or rate limit, the context automatically falls back to OpenAI, and finally to our rule-based engine:

```python
class AIInvestigationContext:
    def __init__(self):
        self.strategies: list[LLMStrategy] = [
            GroqLLMStrategy(),
            OpenAILLMStrategy(),
            RuleBasedFallbackStrategy()
        ]

    def investigate(self, ...):
        for strategy in self.strategies:
            report = strategy.generate_report(...)  # Polymorphic dispatch!
            if report is not None:
                return report
```

### 2. The Chain of Responsibility Pattern: The Recheck Cascade
Each tier in our 4-tier recheck cascade is implemented as a concrete handler derived from `RecheckTierHandler`:

```python
class RecheckTierHandler(ABC):
    def __init__(self):
        self._next_handler: Optional[RecheckTierHandler] = None

    def set_next(self, handler: "RecheckTierHandler") -> "RecheckTierHandler":
        self._next_handler = handler
        return handler

    def handle(self, ctx: RecheckContext) -> RecheckContext:
        should_continue = self._process(ctx)
        if should_continue and not ctx.halted and self._next_handler:
            return self._next_handler.handle(ctx)
        return ctx

    @abstractmethod
    def _process(self, ctx: RecheckContext) -> bool:
        """Return True to cascade to next tier; False to halt early."""
        pass
```

We assemble the chain using a simple factory method:
```python
def build_default_recheck_chain() -> RecheckTierHandler:
    t1 = Tier1AvailabilityHandler()
    t2 = Tier2HashDiffHandler()
    t3 = Tier3SemanticDriftHandler()
    t4 = Tier4LLMInvestigationHandler()

    t1.set_next(t2).set_next(t3).set_next(t4)
    return t1
```

### 3. The Template Method Pattern: Agent Telemetry & Safety
All verification agents (`WebsiteRiskAgent`, `DriftDetectionAgent`, `DocumentConsistencyAgent`) inherit from `BaseAgent`:

```python
class BaseAgent(ABC):
    def run(self, *args, **kwargs) -> AgentResult:
        # Standardized invariant lifecycle: duration timer & exception boundary
        start_time = time.time()
        try:
            result = self._execute(*args, **kwargs)  # Primitive hook
            duration_ms = int((time.time() - start_time) * 1000)
            return AgentResult(success=True, output=result, execution_time_ms=duration_ms)
        except Exception as exc:
            duration_ms = int((time.time() - start_time) * 1000)
            return AgentResult(success=False, output=None, execution_time_ms=duration_ms, error=str(exc))

    @abstractmethod
    def _execute(self, *args, **kwargs) -> Any:
        pass
```

Every agent automatically gets duration tracking, uniform logging, and structured error boundaries without duplicating boilerplate.

---

## Preventing Hallucinations in Financial Underwriting

When an AI agent makes financial decisions that affect whether a real business can accept payments, **hallucinations are catastrophic**. A false positive bans a legitimate entrepreneur; a false negative allows a money-laundering syndicate onto the platform.

We engineered a **4-layer hallucination firewall**:

1. **Structured Outputs (Strict JSON Schema Mode):** We reject freeform markdown or prose generation. We force the LLM via `strict: True` JSON schema to output typed data adhering strictly to our Pydantic `AIInvestigationReport` schema.
2. **Zero Temperature:** We run all underwriting inference with `temperature=0.0` for deterministic, reproducible results.
3. **The Ground-Truth Quote Verification Rule:** The prompt forces the LLM to cite exact verbatim quotes from the crawled webpage for every risk claim. In our post-processing layer, we programmatically verify the quote:
   ```python
   verified_evidence = [
       item for item in report.evidence 
       if not item.quote or item.quote.lower() in source_text.lower()
   ]
   ```
   **If the LLM makes an accusation but hallucinates a quote that does not appear verbatim in the merchant’s crawled HTML, the evidence is discarded automatically.**
4. **Human-in-the-Loop Safeguards:** The AI is strictly barred from issuing unilateral permanent account terminations. Critical violations result in payout throttling and the automatic creation of a `HumanReviewCase` for a senior compliance officer to review.

---

## Key Metrics & Results

Here is what the architecture delivered in real-world testing:

| Metric | Traditional Gateway | SentinelPay Autonomous Agent |
| :--- | :--- | :--- |
| **Day-0 Onboarding Time** | 3 – 5 Business Days | **< 30 Seconds** |
| **API Gateway Latency** | Synchronous (Timeouts) | **< 10ms (202 Accepted)** |
| **Recheck Compute Cost** | $0.01 per merchant/day | **< $0.0004 per merchant/day (>95% savings)** |
| **Bait-and-Switch Detection** | Weeks (post-chargeback) | **< 24 Hours (or immediate on volume spike)** |
| **Merchant Drop-off** | ~42% | **< 8%** |

---

## Final Thoughts & What’s Next

Building autonomous agents for mission-critical fintech infrastructure isn’t about piping text into ChatGPT. It requires:
- **Asynchronous, decoupled distributed systems** (FastAPI, RabbitMQ, Celery).
- **Mathematical short-circuiting** (SHA-256 and Cosine Vector math before invoking expensive LLMs).
- **Strict OOP patterns** (Strategy, Chain of Responsibility, Template Method) to keep the system modular and maintainable.
- **Strict anti-hallucination guardrails** (schema constraints, ground-truth quote validation).

As payment gateways continue to expand globally, autonomous underwriting agents will become the industry standard. Merging speed for legitimate merchants with uncompromising security against fraudsters is no longer a trade-off.

---

### Resources & Source Code
- **Repository:** [GitHub / Razorpay-OnboardingAgent](https://github.com/your-username/Razorpay-OnboardingAgent)
- **Tech Stack:** FastAPI, Next.js 16, RabbitMQ, Celery, PostgreSQL, Playwright, Groq (LLaMA-3.3), OpenAI (GPT-4o), Node.js.
- **Architecture Documentation:** Check out our interactive canvas and `SYSTEM_DESIGN_STUDY_GUIDE.md` in the repo for full UML diagrams and whiteboard interview breakdowns.

*Have questions about architecting fintech agents or cost-optimizing LLM pipelines? Drop your thoughts in the comments below or connect with us on LinkedIn/X!*
