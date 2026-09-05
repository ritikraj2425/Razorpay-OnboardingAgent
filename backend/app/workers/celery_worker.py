import os
from celery import Celery
from app.db.session import SessionLocal

broker_url = os.getenv("CELERY_BROKER_URL", "amqp://guest:guest@localhost:5672//")
celery_app = Celery("onboarding_tasks", broker=broker_url)

# Fix for RabbitMQ 4.0+ (disables the transient pidbox queue)
celery_app.conf.worker_enable_remote_control = False
celery_app.conf.worker_send_task_events = False

@celery_app.task(name="process_onboarding")
def process_onboarding(merchant_id: int, payload_dict: dict):
    from app.services.merchant_service import process_onboarding_pipeline
    db = SessionLocal()
    try:
        process_onboarding_pipeline(db, merchant_id, payload_dict)
    finally:
        db.close()
