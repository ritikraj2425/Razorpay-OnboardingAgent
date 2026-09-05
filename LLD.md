# Low Level Design (LLD)

The SentinelPay system is built on an **Event-Driven Microservices Architecture** to guarantee high availability and prevent HTTP timeouts during heavy AI tasks. This document details the technical implementation of both the **Onboarding** and **Recheck** pipelines.

---

## 1. Synchronous API Gateway (FastAPI)

- **Role:** Handles incoming HTTP requests from the Next.js frontend or MCP agents.
- **Onboarding Flow (`POST /api/merchants/register`):** 
  - Validates the payload using Pydantic `MerchantRegistrationSchema`.
  - Creates a database record with `status="PROCESSING"`.
  - Immediately pushes an `onboarding_task` payload to RabbitMQ via `process_onboarding.delay()`.
  - **Response:** Returns `202 Accepted` in milliseconds, allowing the frontend to implement long-polling (`GET /api/merchants/{id}/status`).
- **Recheck Flow (`POST /api/rechecks/trigger`):**
  - Triggered by APScheduler.
  - Queries the database for merchants matching the recheck cadence (1, 7, or 30 days based on their risk profile).
  - Pushes a `recheck_task` to RabbitMQ for each identified merchant.

---

## 2. Message Broker (RabbitMQ)

- **Role:** Decouples the fast API from the slow AI tasks, acting as the central nervous system.
- **Queues:**
  - `onboarding_tasks`: Holds merchant payloads waiting for the 17-step pipeline.
  - `recheck_tasks`: Holds merchant IDs waiting for post-onboarding monitoring.
  - `notification_events`: Holds completed merchant decisions waiting for email dispatch.

---

## 3. Asynchronous AI Worker (Celery + Python)

- **Role:** The workhorse of the system. Runs in an isolated process to handle heavy network and LLM bounds.
- **Onboarding Pipeline (`app.workers.celery_worker.process_onboarding`):** 
  - Consumes from `onboarding_tasks`. 
  - Orchestrates Playwright to crawl the web, makes external HTTP calls to KYC validation APIs (PAN, GSTIN), and interacts with Groq/Gemini LLMs to parse unstructured policies.
  - **State Management:** Continuously writes its progress back to the PostgreSQL database (`onboarding_steps` JSON array) so the frontend UI can visualize the pipeline steps in real-time.
- **Recheck Pipeline (`app.services.recheck_orchestrator`):**
  - Consumes from `recheck_tasks`.
  - Executes a strict 4-tier cascade:
    1. HTTP Ping
    2. SHA-256 Hash of website text
    3. Vector Similarity (Semantic Analysis)
    4. Full LLM Inference
  - Halts early if no drift is detected to save API costs.
- **Output:** Updates the final decision/status and uses `pika` to publish a message to `notification_events`.

---

## 4. Notification Microservice (Node.js)

- **Role:** A lightweight, isolated event listener built with `amqplib` and Node.js.
- **Action:** Consumes from `notification_events`. 
- **Delivery:** Reads the JSON event payload, formats the AI-generated underwriter memo into an HTML template, and dispatches emails via Nodemailer (connected to Ethereal Mail for testing).

---

## 5. Database Schema (PostgreSQL)

The primary data store is managed via SQLAlchemy ORM.

- **`merchants` Table:** Stores the core merchant profile, PAN/GSTIN data, current `status` (APPROVED, REJECTED, SUSPENDED, PROCESSING, PENDING_REMEDIATION), and the `onboarding_steps` JSON array.
- **`merchant_snapshots` Table:** Stores the baseline HTML and extracted text from the initial Playwright crawl. Used heavily by the Recheck Agent (Tier 2 & 3) to diff against new content.
- **`human_review_cases` Table:** When the Recheck Agent detects minor semantic drift or borderline risk, it creates a record here for manual underwriter review rather than auto-suspending the merchant.
