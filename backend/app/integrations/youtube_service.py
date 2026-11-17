
import html

import httpx

from app.core.config import YOUTUBE_API_KEY, YOUTUBE_SEARCH_COST
from app.integrations.youtube_quota import youtube_quota

SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
TIMEOUT = httpx.Timeout(10.0)


class YouTubeNotConfigured(Exception):
    """YOUTUBE_API_KEY is missing."""


class YouTubeAPIError(Exception):
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _best_thumbnail(thumbnails: dict) -> str | None:
    for key in ("high", "medium", "default"):
        if key in thumbnails and thumbnails[key].get("url"):
            return thumbnails[key]["url"]
    return None


def _error_reason(resp: httpx.Response) -> tuple[str, str]:
    """Return (reason, message) from a Google error body without exposing the request URL."""
    try:
        err = resp.json().get("error", {})
        reason = (err.get("errors") or [{}])[0].get("reason", "")
        return reason, err.get("message", "")
    except Exception:
        return "", ""


def search_videos(
    query: str,
    *,
    max_results: int = 10,
    topic: str | None = None,
    level: str | None = None,
    video_duration: str | None = None,
) -> list[dict]:
    """Search YouTube and return dicts shaped like ExternalCourse fields."""
    query = (query or "").strip()
    if not query:
        raise ValueError("query must not be empty")
    if not YOUTUBE_API_KEY:
        raise YouTubeNotConfigured("YOUTUBE_API_KEY is not configured.")

    max_results = max(1, min(max_results, 25))
    params = {
        "part": "snippet",
        "type": "video",
        "q": query,
        "maxResults": max_results,
        "videoEmbeddable": "true",
        "safeSearch": "strict",
        "relevanceLanguage": "en",
        "key": YOUTUBE_API_KEY,
    }
    if video_duration in ("medium", "long"):
        params["videoDuration"] = video_duration

    youtube_quota.reserve(YOUTUBE_SEARCH_COST)

    try:
        resp = httpx.get(SEARCH_URL, params=params, timeout=TIMEOUT)
    except httpx.RequestError:
        youtube_quota.refund(YOUTUBE_SEARCH_COST)
        raise YouTubeAPIError("Could not reach the YouTube API.", 503) from None

    if resp.status_code != 200:
        reason, _ = _error_reason(resp)
        if reason in ("quotaExceeded", "dailyLimitExceeded", "rateLimitExceeded"):
            raise YouTubeAPIError("YouTube API quota exceeded.", 429)
        youtube_quota.refund(YOUTUBE_SEARCH_COST)
        if resp.status_code in (400, 403) and reason in (
            "keyInvalid", "ipRefererBlocked", "accessNotConfigured", "forbidden"
        ):
            raise YouTubeAPIError(f"YouTube API key rejected ({reason}).", 502)
        raise YouTubeAPIError(
            f"YouTube API error (HTTP {resp.status_code}, {reason or 'unknown'}).",
            502,
        )

    try:
        items = resp.json().get("items", [])
    except Exception:
        raise YouTubeAPIError("Invalid response from YouTube API.", 502) from None

    results: list[dict] = []
    for item in items:
        video_id = (item.get("id") or {}).get("videoId")
        snippet = item.get("snippet") or {}
        if not video_id or not snippet.get("title"):
            continue
        results.append(
            {
                "provider": "youtube",
                "external_id": video_id,
                "title": html.unescape(snippet["title"])[:300],
                "description": html.unescape(snippet.get("description", "")) or None,
                "url": f"https://www.youtube.com/watch?v={video_id}",
                "thumbnail_url": _best_thumbnail(snippet.get("thumbnails") or {}),
                "channel_or_org": html.unescape(snippet.get("channelTitle", "")) or None,
                "topic": topic,
                "level": level,
                "is_free": True,
                "is_link_only": False,
            }
        )
    return results
