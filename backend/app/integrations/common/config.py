
import os

from dotenv import load_dotenv

# Load existing backend environment variables.
BACKEND_ENV_FILE = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../../.env")
)

load_dotenv(BACKEND_ENV_FILE)


def get_optional_env(name: str) -> str | None:
    """Return an optional environment variable."""
    value = os.getenv(name)
    return value.strip() if value and value.strip() else None


def get_positive_int(name: str, default: int) -> int:
    """Read a positive integer from environment variables."""
    value = os.getenv(name)

    if value is None or not value.strip():
        return default

    try:
        parsed = int(value)
    except ValueError:
        raise ValueError(f"{name} must be an integer.")

    if parsed <= 0:
        raise ValueError(f"{name} must be greater than zero.")

    return parsed


# HTTP settings
INTEGRATION_TIMEOUT_SECONDS = get_positive_int(
    "INTEGRATION_TIMEOUT_SECONDS", 15
)

INTEGRATION_MAX_RETRIES = get_positive_int(
    "INTEGRATION_MAX_RETRIES", 2
)

# Google Calendar credentials (optional)
GOOGLE_CALENDAR_CLIENT_ID = get_optional_env(
    "GOOGLE_CALENDAR_CLIENT_ID"
)

GOOGLE_CALENDAR_CLIENT_SECRET = get_optional_env(
    "GOOGLE_CALENDAR_CLIENT_SECRET"
)

GOOGLE_CALENDAR_REDIRECT_URI = get_optional_env(
    "GOOGLE_CALENDAR_REDIRECT_URI"
)
