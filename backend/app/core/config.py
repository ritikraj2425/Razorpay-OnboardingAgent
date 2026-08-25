from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./sentinelpay.db"
    mock_ai: bool = True


settings = Settings()
