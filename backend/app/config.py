import os
from pydantic_settings import BaseSettings

def get_sanitized_database_url() -> str:
    raw_url = os.getenv("DATABASE_URL", "sqlite:///./mindbridge.db")
    if raw_url.startswith("postgres://"):
        return raw_url.replace("postgres://", "postgresql://", 1)
    return raw_url

class Settings(BaseSettings):
    PROJECT_NAME: str = "MindBridge Campus"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = get_sanitized_database_url()
    JWT_SECRET: str = os.getenv("JWT_SECRET", "mindbridge-secret-super-secure-key-2026-wellbeing")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
