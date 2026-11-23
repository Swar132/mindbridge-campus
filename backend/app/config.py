import os
from pydantic_settings import BaseSettings

def get_sanitized_database_url() -> str:
    raw_url = os.getenv("DATABASE_URL", "sqlite:///./mindbridge.db")
    if raw_url.startswith("postgres://"):
        return raw_url.replace("postgres://", "postgresql+psycopg2://", 1)
    if raw_url.startswith("postgresql://") and not raw_url.startswith("postgresql+"):
        return raw_url.replace("postgresql://", "postgresql+psycopg2://", 1)
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

    # Web Push / VAPID Keys (Free Browser Push Notifications)
    VAPID_PUBLIC_KEY: str = os.getenv("VAPID_PUBLIC_KEY", "BCGGhMgS9-rTDZwMhoAyseaTgVTnNV4_q_C1QKdtZLDR5GSG2LqSH7GvEWr1JdAdlOceySLK5XYfuW7FbmrcIB4")
    VAPID_PRIVATE_KEY: str = os.getenv("VAPID_PRIVATE_KEY", "Gch5-s3r6tgT7zc2-LAefoRC3PZ7nZ-p-PhgU4NAtzY")
    VAPID_CLAIMS_EMAIL: str = os.getenv("VAPID_CLAIMS_EMAIL", "mailto:wellness@mindbridge.campus")

    # Twilio Programmable Messaging for WhatsApp
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_WHATSAPP_FROM: str = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")
    TWILIO_STATUS_CALLBACK_URL: str = os.getenv("TWILIO_STATUS_CALLBACK_URL", "")
    TWILIO_SANDBOX_KEYWORD: str = os.getenv("TWILIO_SANDBOX_KEYWORD", "join mindbridge")
    # Approved WhatsApp Content SIDs for production outside 24h window
    TWILIO_CONTENT_SID_DAILY_REMINDER: str = os.getenv("TWILIO_CONTENT_SID_DAILY_REMINDER", "")
    TWILIO_CONTENT_SID_WEEKLY_SUMMARY: str = os.getenv("TWILIO_CONTENT_SID_WEEKLY_SUMMARY", "")
    TWILIO_CONTENT_SID_WELLBEING_ALERT: str = os.getenv("TWILIO_CONTENT_SID_WELLBEING_ALERT", "")
    TWILIO_CONTENT_SID_ACADEMIC_REMINDER: str = os.getenv("TWILIO_CONTENT_SID_ACADEMIC_REMINDER", "")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
