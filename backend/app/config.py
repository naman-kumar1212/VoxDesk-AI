"""
VoxDesk AI — Configuration
Reads all settings from environment variables.
Never exposes secrets to the frontend.
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Flask
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    DEBUG: bool = os.environ.get("FLASK_ENV", "production") == "development"

    # CORS — only allow the configured frontend origin
    FRONTEND_ORIGIN: str = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")

    # Database — Supabase Free PostgreSQL via SQLAlchemy
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "")

    # Groq — Free Plan only. Never use Developer tier.
    GROQ_API_KEY: str = os.environ.get("GROQ_API_KEY", "")
    WHISPER_MODEL: str = os.environ.get("WHISPER_MODEL", "whisper-large-v3-turbo")
    WHISPER_LANGUAGE: str = os.environ.get("WHISPER_LANGUAGE", "en")

    # Gemini — Free Tier only. Never attach billing.
    GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.environ.get("GEMINI_MODEL", "gemini-3.8-flash")

    # TTS — browser only; no external TTS provider
    TTS_PROVIDER: str = "browser"

    # Admin demo key — stored server-side only
    ADMIN_API_KEY: str = os.environ.get("ADMIN_API_KEY", "")

    # Demo organization — resolved from server config, never from client
    DEMO_ORGANIZATION_ID: str = os.environ.get("DEMO_ORGANIZATION_ID", "")

    # Audio limits
    MAX_AUDIO_MB: int = int(os.environ.get("MAX_AUDIO_MB") or "4")
    MAX_AUDIO_BYTES: int = MAX_AUDIO_MB * 1024 * 1024
    MAX_RECORDING_SECONDS: int = int(os.environ.get("MAX_RECORDING_SECONDS") or "45")


settings = Config()

