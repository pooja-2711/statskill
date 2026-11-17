import os
import secrets

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

SECRET_KEY = os.getenv("SECRET_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# YouTube configuration
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
YOUTUBE_DAILY_QUOTA_LIMIT = int(os.getenv("YOUTUBE_DAILY_QUOTA_LIMIT", "8000"))
YOUTUBE_SEARCH_COST = 100

# Daily content ingestion configuration
INGEST_ENABLED = os.getenv("INGEST_ENABLED", "true").lower() == "true"
INGEST_TIMEZONE = "Asia/Kolkata"
INGEST_HOUR_IST = int(os.getenv("INGEST_HOUR_IST", "6"))
INGEST_MINUTE_IST = int(os.getenv("INGEST_MINUTE_IST", "0"))

# Groq configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

if not SECRET_KEY:
    raise ValueError(
        "SECRET_KEY is missing from backend/.env. "
        "Generate one and add it before starting the API."
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
