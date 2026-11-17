
import time

import httpx

from app.core.config import GEMINI_API_KEY


PRIMARY_MODEL = "gemini-3.8-flash"

FALLBACK_MODELS = [
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
]

BASE_URL = (
    "https://generativelanguage.googleapis.com/v1beta/"
    "models/{model}:generateContent"
)

TIMEOUT = httpx.Timeout(120.0, connect=15.0)

RETRYABLE_STATUSES = {500, 502, 503, 504}


class GeminiUnavailableError(Exception):
    pass


def generate_content(payload: dict) -> tuple[dict, str]:
    """
    Try the primary Gemini model first.
    Retry temporary failures and then try fallback models.

    Returns:
        (Gemini response JSON, model name)
    """
    if not GEMINI_API_KEY:
        raise GeminiUnavailableError(
            "GEMINI_API_KEY is not configured."
        )

    headers = {
        "x-goog-api-key": GEMINI_API_KEY,
        "Content-Type": "application/json",
    }

    models = [PRIMARY_MODEL, *FALLBACK_MODELS]
    errors = []

    with httpx.Client(timeout=TIMEOUT) as client:
        for model in models:
            url = BASE_URL.format(model=model)

            for attempt in range(2):
                try:
                    response = client.post(
                        url,
                        headers=headers,
                        json=payload,
                    )

                    if response.status_code == 200:
                        return response.json(), model

                    message = response.text[:1000]
                    errors.append(
                        f"{model}: HTTP {response.status_code}: {message}"
                    )

                    if response.status_code not in RETRYABLE_STATUSES:
                        break

                except httpx.TimeoutException as exc:
                    errors.append(f"{model}: timeout ({exc})")

                except httpx.RequestError as exc:
                    errors.append(f"{model}: network error ({exc})")

                if attempt == 0:
                    time.sleep(1.5)

    raise GeminiUnavailableError(
        "All Gemini models failed. " + " | ".join(errors)
    )
