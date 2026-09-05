import os
import json
import pika

def publish_notification(event_type: str, merchant_data: dict):
    broker_url = os.getenv("CELERY_BROKER_URL", "amqp://guest:guest@localhost:5672/")
    if broker_url.endswith("//"):
        broker_url = broker_url[:-1]
    try:
        params = pika.URLParameters(broker_url)
        connection = pika.BlockingConnection(params)
        channel = connection.channel()
        channel.queue_declare(queue="notification_events", durable=True)
        
        message = {
            "event_type": event_type,
            "merchant": merchant_data
        }
        
        channel.basic_publish(
            exchange="",
            routing_key="notification_events",
            body=json.dumps(message),
            properties=pika.BasicProperties(
                delivery_mode=2,  # make message persistent
            )
        )
        connection.close()
    except Exception as e:
        print(f"Failed to publish notification: {e}")
