import httpx

from app.core.config import GEMINI_API_KEY
from app.integrations.quiz_parser import QuizParseError, build_quiz_prompt, parse_quiz_json
from app.schemas.course_quiz import GeneratedQuiz

GEMINI_MODEL = "gemini-3.8-flash"  # same model as pdf_ai.py
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
TIMEOUT = httpx.Timeout(90.0, connect=10.0)
MAX_ATTEMPTS = 2  # one retry when the model returns malformed JSON


class GeminiNotConfigured(Exception):
    """GEMINI_API_KEY is missing."""


class GeminiQuizError(Exception):
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _extract_text(data: dict) -> str:
    feedback = data.get("promptFeedback") or {}
    if feedback.get("blockReason"):
        raise GeminiQuizError("The AI could not generate a quiz for this course.", 422)

    candidates = data.get("candidates") or []
    if not candidates:
        raise GeminiQuizError("The AI returned no result.", 502)

    parts = (candidates[0].get("content") or {}).get("parts") or []
    return "".join(
        p.get("text", "") for p in parts if isinstance(p, dict) and not p.get("thought")
    )


def _call_gemini(prompt: str) -> str:
    body = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.4,
            "maxOutputTokens": 8192,
        },
    }
    headers = {"Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY}

    try:
        resp = httpx.post(GEMINI_URL, json=body, headers=headers, timeout=TIMEOUT)
    except httpx.RequestError:
        raise GeminiQuizError("Could not reach the AI service.", 503) from None

    if resp.status_code == 429:
        raise GeminiQuizError("AI service is busy. Try again shortly.", 429)
    if resp.status_code != 200:
        raise GeminiQuizError(f"AI service error (HTTP {resp.status_code}).", 502)

    try:
        return _extract_text(resp.json())
    except GeminiQuizError:
        raise
    except Exception:
        raise GeminiQuizError("Invalid response from the AI service.", 502) from None


def generate_quiz(
    *,
    title: str,
    description: str | None,
    channel: str | None,
    topic: str | None,
    level: str | None,
    num_questions: int,
) -> tuple[GeneratedQuiz, str]:
    if not GEMINI_API_KEY:
        raise GeminiNotConfigured("GEMINI_API_KEY is not configured.")

    prompt = build_quiz_prompt(
        title=title,
        description=description,
        channel=channel,
        topic=topic,
        level=level,
        num_questions=num_questions,
    )

    last_error = "The AI returned an invalid quiz."
    for _ in range(MAX_ATTEMPTS):
        raw = _call_gemini(prompt)
        try:
            return parse_quiz_json(raw, expected=num_questions), GEMINI_MODEL
        except QuizParseError as exc:
            last_error = str(exc)

    raise GeminiQuizError(f"{last_error} Please try again.", 502)