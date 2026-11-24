# SentinelPay - 10-Minute Complete Pitch Script (Open Track)

*Note: Speak at a moderate, confident pace. Pause at the marked `[Pauses]` to let the technical weight of your statements sink in.*

---

## Part 1: The Problem & Introduction (1.5 Minutes)
**[Action: Stand in front of the judges. Have a blank browser window open, and your IDE/Terminals running in the background]**

"Hello everyone, and thank you to the judges for your time today. For this hackathon, we decided to compete in the **Open Track**. The problem we chose to tackle is one of the most expensive and dangerous pain points in the modern Fintech ecosystem: **Merchant Risk, Underwriting, and Fraud Prevention.**

Right now, if a merchant wants to accept payments, the onboarding process is heavily manual. Human underwriters have to manually verify government IDs, manually crawl the merchant's website, and manually check for prohibited items. This process takes days, creates massive bottlenecks, and costs companies millions in human capital.

But the bigger problem isn't just speed—it's fraud. Specifically, a technique known as **'Bait and Switch'**. 

A fraudulent merchant will onboard with a perfectly clean, policy-compliant website selling t-shirts. They get approved, they get their API keys, and the very next day, they completely rewrite their website's frontend to sell illicit goods, counterfeit products, or crypto scams. Because underwriters only check the website on Day-0, the payment gateway processes illicit transactions for weeks before anyone notices. **[Pause]**

We decided this was an engineering problem that could be solved with modern AI. So, we built **SentinelPay**."

---

## Part 2: The Solution & Microservices Overview (1 Minute)
"SentinelPay is a fully autonomous, event-driven AI underwriting platform. It does two things exceptionally well:

First, it completely automates **Day-0 Onboarding**. It replaces human underwriters with an AI agent pipeline that verifies government documents and scrapes websites in real-time. 

Second—and more importantly—it introduces a **Continuous Recheck Engine**. This is an autonomous system that continuously monitors approved merchants over time to catch semantic drift and Bait-and-Switch fraud before a chargeback ever occurs.

I want to emphasize that this is not a simple monolithic python script. We engineered a highly decoupled architecture split across **4 distinct Microservices**:
1. A **FastAPI Gateway** to handle fast concurrent web traffic.
2. A **RabbitMQ Message Broker** to queue massive workloads asynchronously.
3. Distributed **Celery AI Workers** to handle the heavy LLM computation.
4. And a **Node.js Notification Service** to handle all asynchronous merchant communication.

Let me show you how they all work together."

---

## Part 3: Live Localhost Demo & Terminal Tour (2 Minutes)
**[Action: Open your Next.js Frontend on Localhost. Start filling out the Onboarding Form with a PAN, GSTIN, and a dummy Domain]**

"Here we are on localhost. I am a merchant submitting my application. Now, because AI inference and headless browsing take time, standard HTTP requests would timeout. So instead, when I click submit..."

**[Action: Click Submit. The frontend should start showing the live loading steps]**

"...our frontend instantly initiates a **Long-Polling HTTP connection**. The UI is currently rendering live updates straight from our database. While that runs, let me pull back the curtain and show you our terminals."

**[Action: Alt-Tab to your Terminal window. Point to Terminal 1]**

"Here in Terminal 1, we have our **FastAPI Gateway**. Its only job is concurrent I/O. It receives the payload, validates it using strict Pydantic schemas, writes a 'PROCESSING' state to the database, and immediately returns a 202 Accepted. It then offloads the heavy lifting."

**[Action: Point to Terminal 2]**

"It offloads it here, to Terminal 2—our **RabbitMQ Message Broker**. RabbitMQ acts as the central nervous system of our platform, buffering payloads in AMQP queues so our web server never blocks."

**[Action: Point to Terminal 3]**

"And here in Terminal 3, this is our distributed **Celery AI Worker pool**. These workers are currently consuming tasks off the RabbitMQ queue. Right now, this terminal is launching a headless Playwright browser, extracting the merchant's DOM, and feeding it into an LLM pipeline to calculate a mathematical Trust Score.

And as you can see..."
**[Action: Switch back to the Frontend UI]**
"...the frontend just received the final polling update. The merchant is approved, in seconds, without a single human in the loop."

---

## Part 4: Architecture Canvas Deep Dive (2.5 Minutes)
**[Action: Open `System_Architecture.html` in the browser. Start fully zoomed out to show the sheer scale of the 4000x4000 canvas.]**

"To make the data flow perfectly clear, we built an interactive architecture canvas. **[Pause to let them look at the massive diagram]**

Let me zoom into the **Day-0 Onboarding Pipeline**." 

**[Action: Zoom in and pan across the top half of the canvas, moving from Next.js on the left to Node.js on the right]**

"As you can see, the flow is strictly one-way until the AI finishes. FastAPI publishes the `onboarding_tasks` routing key to RabbitMQ. Celery picks it up. 

But notice what happens when Celery is done. It doesn't send the data back to the user. Instead, the data loops back into RabbitMQ. Celery publishes a brand new event: `notification_events`. 

This is where our 4th microservice comes in—our **Node.js worker**. It is specifically listening to that event queue. It consumes the payload, compiles an HTML template using the AI's underwriter memo, and dispatches a Nodemailer SMTP email to the merchant. By decoupling the notification system, our AI workers are immediately freed up to underwrite the next merchant in the queue without waiting for SMTP servers."

---

## Part 5: The Post-Onboarding Cascade Engine (2 Minutes)
**[Action: Pan down to the "Post-Onboarding Recheck Pipeline" on the canvas]**

"That handles Day-0. But what about Day-7? What if they Bait and Switch?

This brings us to our **Post-Onboarding Recheck Pipeline**. We have an APScheduler cron job running inside FastAPI that sweeps our PostgreSQL database every 30 minutes, looking for merchants due for a checkup.

Now, running a full LLM inference on 100,000 merchants every day is computationally and financially impossible. So, we didn't just throw AI at the problem. We designed a mathematical **4-Tier Cascade Architecture** to halt compute early."

**[Action: Point to the 4-Tier box inside the bottom Celery container]**

"When a recheck task hits our Celery workers, it goes through 4 gates:
1. **Tier 1**: A lightweight network ping. If it 404s, we fail them instantly. Zero LLM cost.
2. **Tier 2**: We run a cryptographic **SHA-256 Byte Hash** on their current website HTML, and compare it against the snapshot hash we took on Day-0. If the hashes match perfectly, it mathematically guarantees that not a single byte of code has changed on their homepage. We approve them instantly. Zero LLM cost.
3. **Tier 3**: If the hashes changed, they might have just updated a CSS color or a typo. So, we run a **Semantic Vector Math** engine. We extract the text, compute Term-Frequency vectors, and calculate the **Cosine Similarity Distance** between their new website and their old website. If the distance is less than 0.2, the semantic meaning hasn't changed. We approve them. Zero LLM cost.
4. **Tier 4**: Only if the cosine distance exceeds our 0.2 threshold—meaning the actual core business offering has radically drifted—do we finally escalate the payload to an expensive LLM like Groq or Gemini to investigate for fraud.

If the LLM detects a Bait and Switch, Celery updates the database. **But we don't instantly suspend them**, which could cause massive false-positive nightmares for a payment gateway. Instead, the AI dynamically lowers their **Daily Transaction Limit** to a safe threshold, choking their fraud volume while flagging them for manual Admin review."

---

## Part 6: Grace Periods & Conclusion (1 Minute)
**[Action: Zoom back out to show the full canvas one last time]**

"Finally, we handle edge cases gracefully. If the AI detects a minor policy violation during onboarding—like a missing refund policy—it doesn't instantly ban the merchant. It assigns a Trust Score between 60 and 84, and flags them for `PENDING_REMEDIATION`. 

Our cron job enforces a strict **48-Hour Grace Period**. If the merchant doesn't fix their website and request a manual review within 48 hours, our backend automatically executes an SQL query to permanently downgrade them to `REJECTED`. 

**[Action: Turn back to the judges]**

In conclusion, SentinelPay isn't just an AI wrapper. By combining asynchronous event-driven architecture, distributed task queues, 4 isolated microservices, and mathematical vector optimization, we've built an underwriting engine that is infinitely scalable, deeply autonomous, and completely resilient to modern fraud. 

Thank you, and we'd love to take any questions on our architecture or implementation."
