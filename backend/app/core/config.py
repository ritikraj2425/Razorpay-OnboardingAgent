from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./sentinelpay.db"
    seed_demo_data: bool = False
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    meta_ad_library_token: str = ""


settings = Settings()
