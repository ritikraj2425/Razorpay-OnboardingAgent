# SentinelPay - Architecture Cheat Sheet

This is a concise, high-level summary of the architecture drawn in the interactive canvas. Use this to quickly explain the system flow to judges.

---

## 🏗️ The 4 Microservices
The system is fully decoupled into 4 isolated services communicating asynchronously:
1. **Next.js & FastAPI (The Gateway)**: Next.js submits forms and long-polls for updates. FastAPI validates payloads (Pydantic) and manages fast concurrent I/O.
2. **RabbitMQ (The Broker)**: Acts as the central nervous system, buffering workloads in AMQP queues (`onboarding_tasks` and `notification_events`) so the web servers never block.
3. **Celery AI Workers (The Brain)**: Distributed Python workers that execute heavy Playwright web-scraping and LLM inference tasks in the background.
4. **Node.js (The Communicator)**: An isolated service dedicated purely to listening for completion events and compiling/dispatching SMTP emails to merchants.

---

## 🚀 Flow 1: Day-0 Onboarding
*How a merchant is instantly underwritten:*

1. **Submit**: Merchant submits PAN/Domain via Next.js. FastAPI writes `status='PROCESSING'` to PostgreSQL.
2. **Queue**: FastAPI publishes an event to RabbitMQ (`onboarding_tasks`).
3. **Analyze**: A Celery worker consumes the task, crawls the merchant's DOM using Playwright, and passes the context to an LLM to calculate a Trust Score.
4. **Update & Loop**: Celery writes `status='APPROVED'` to the database and publishes a *new* event back into RabbitMQ (`notification_events`).
5. **Notify**: The Node.js service consumes the notification event and emails the merchant their approval.

---

## 🛡️ Flow 2: Continuous Recheck (Bait & Switch Prevention)
*How the system catches merchants who change their website to sell illicit goods:*

1. **Trigger**: An APScheduler cron job in FastAPI sweeps the database every 30 mins for merchants due for a checkup, and sends tasks to RabbitMQ.
2. **The 4-Tier Cascade**: Celery consumes the task and executes a strict mathematical cascade to save LLM compute costs:
   - **Tier 1 (Ping)**: Quick network ping. Fails if 404/500.
   - **Tier 2 (Byte Diff)**: Calculates a SHA-256 hash of the current HTML. If it matches the Day-0 snapshot perfectly, it halts and approves.
   - **Tier 3 (Semantic Math)**: Computes Term-Frequency vectors and calculates the **Cosine Similarity** distance. If the distance is `< 0.2`, the semantic meaning hasn't changed. Halts and approves.
   - **Tier 4 (LLM Escalation)**: Only if the distance `> 0.2` (meaning the site radically changed) does it escalate to an LLM to investigate for fraud.
3. **The Outcome**: If Bait and Switch is detected, the AI does not ban them outright. It dynamically lowers their **Daily Transaction Limit** to throttle fraud, and triggers Node.js to email an Admin for manual review.
