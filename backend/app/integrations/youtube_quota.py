import threading
from datetime import datetime, timezone

from app.core.config import YOUTUBE_DAILY_QUOTA_LIMIT

try:
    from zoneinfo import ZoneInfo
    _QUOTA_TZ = ZoneInfo("America/Los_Angeles")
except Exception:
    _QUOTA_TZ = timezone.utc


class QuotaExceeded(Exception):
    """Raised when the local daily YouTube quota budget is used up."""


class QuotaGuard:
    def __init__(self, daily_limit: int):
        self._limit = daily_limit
        self._used = 0
        self._day = self._today()
        self._lock = threading.Lock()

    @staticmethod
    def _today():
        return datetime.now(_QUOTA_TZ).date()

    def _roll_day(self) -> None:
        today = self._today()
        if today != self._day:
            self._day = today
            self._used = 0

    def reserve(self, cost: int) -> None:
        with self._lock:
            self._roll_day()
            if self._used + cost > self._limit:
                raise QuotaExceeded(
                    f"Daily YouTube quota budget reached ({self._used}/{self._limit} units)."
                )
            self._used += cost

    def refund(self, cost: int) -> None:
        with self._lock:
            self._roll_day()
            self._used = max(0, self._used - cost)

    def status(self) -> dict:
        with self._lock:
            self._roll_day()
            return {
                "used": self._used,
                "limit": self._limit,
                "remaining": self._limit - self._used,
                "day": str(self._day),
            }


youtube_quota = QuotaGuard(YOUTUBE_DAILY_QUOTA_LIMIT)