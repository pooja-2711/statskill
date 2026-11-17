import calendar
import html
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from urllib.parse import urlparse

import feedparser
import httpx

MAX_FEED_BYTES = 5 * 1024 * 1024
MAX_ITEMS_PER_FEED = 30
TITLE_MAX = 500
SNIPPET_MAX = 300  # short snippet only, never full article text
URL_MAX = 1000
TIMEOUT = httpx.Timeout(15.0, connect=8.0)
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; StatskillBot/1.0; educational news aggregator)",
    "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
}

_SCRIPT_STYLE = re.compile(r"<(script|style)\b.*?</\1>", re.IGNORECASE | re.DOTALL)
_TAGS = re.compile(r"<[^>]+>")
_SPACES = re.compile(r"\s+")


class FeedError(Exception):
    """A single feed could not be fetched or parsed."""


@dataclass
class FeedItem:
    source_key: str
    source_name: str
    title: str
    url: str
    summary: str | None
    published_at: datetime | None
    feed_url: str


@dataclass
class SourceResult:
    source_key: str
    items: list[FeedItem] = field(default_factory=list)
    feeds: list[dict] = field(default_factory=list)  # {url, ok, count, error}

    @property
    def status(self) -> str:
        if not self.feeds:
            return "failed"
        ok = sum(1 for f in self.feeds if f["ok"])
        if ok == len(self.feeds):
            return "ok"
        return "partial" if ok else "failed"

    @property
    def error_summary(self) -> str | None:
        errors = [f"{f['url']}: {f['error']}" for f in self.feeds if not f["ok"]]
        return "; ".join(errors)[:300] if errors else None


def _is_http_url(url: str | None) -> bool:
    if not url or len(url) > URL_MAX:
        return False
    parsed = urlparse(url)
    return parsed.scheme in ("http", "https") and bool(parsed.netloc)


def clean_text(value: str | None) -> str:
    if not value:
        return ""
    text = html.unescape(value)
    text = _SCRIPT_STYLE.sub(" ", text)
    text = _TAGS.sub(" ", text)
    text = html.unescape(text)
    return _SPACES.sub(" ", text).strip()


def truncate(text: str, limit: int) -> str:
    if len(text) <= limit:
        return text
    cut = text[: limit - 1].rsplit(" ", 1)[0].rstrip(" ,;:-")
    return (cut or text[: limit - 1]) + "…"


def fetch_feed(url: str) -> bytes:
    if not _is_http_url(url):
        raise FeedError("invalid feed URL")
    try:
        with httpx.stream("GET", url, headers=HEADERS, timeout=TIMEOUT, follow_redirects=True) as resp:
            if resp.status_code != 200:
                raise FeedError(f"HTTP {resp.status_code}")
            chunks: list[bytes] = []
            size = 0
            for chunk in resp.iter_bytes():
                size += len(chunk)
                if size > MAX_FEED_BYTES:
                    raise FeedError("feed too large")
                chunks.append(chunk)
            return b"".join(chunks)
    except httpx.RequestError as exc:
        raise FeedError(f"network error ({type(exc).__name__})") from None


def _entry_datetime(entry) -> datetime | None:
    for attr in ("published_parsed", "updated_parsed"):
        parsed = entry.get(attr)
        if parsed:
            try:
                return datetime.fromtimestamp(calendar.timegm(parsed), tz=timezone.utc)
            except (ValueError, OverflowError, OSError):
                continue
    return None


def parse_feed(content: bytes, *, source_key: str, source_name: str, feed_url: str) -> list[FeedItem]:
    parsed = feedparser.parse(content)
    if not parsed.entries:
        raise FeedError("not a valid feed" if parsed.bozo else "feed has no items")

    now = datetime.now(timezone.utc)
    items: list[FeedItem] = []
    for entry in parsed.entries[:MAX_ITEMS_PER_FEED]:
        title = truncate(clean_text(entry.get("title")), TITLE_MAX)
        link = (entry.get("link") or "").strip()
        if not title or not _is_http_url(link):
            continue

        summary = clean_text(entry.get("summary") or entry.get("description"))
        summary = truncate(summary, SNIPPET_MAX) if summary and summary != title else None

        published = _entry_datetime(entry)
        if published and published > now:
            published = now  # ignore bad future timestamps

        items.append(
            FeedItem(
                source_key=source_key,
                source_name=source_name,
                title=title,
                url=link,
                summary=summary,
                published_at=published,
                feed_url=feed_url,
            )
        )
    if not items:
        raise FeedError("no usable items")
    return items


def fetch_source(source_key: str, source_name: str, feed_urls: list[str]) -> SourceResult:
    """Fetch every feed of one source. Never raises: a dead feed is recorded and skipped."""
    result = SourceResult(source_key=source_key)
    seen_urls: set[str] = set()

    for feed_url in feed_urls or []:
        try:
            content = fetch_feed(feed_url)
            items = parse_feed(
                content, source_key=source_key, source_name=source_name, feed_url=feed_url
            )
            fresh = [i for i in items if i.url not in seen_urls]
            seen_urls.update(i.url for i in fresh)
            result.items.extend(fresh)
            result.feeds.append({"url": feed_url, "ok": True, "count": len(fresh), "error": None})
        except FeedError as exc:
            result.feeds.append({"url": feed_url, "ok": False, "count": 0, "error": str(exc)})
        except Exception as exc:  # parser surprises must not stop other feeds
            result.feeds.append(
                {"url": feed_url, "ok": False, "count": 0, "error": f"unexpected ({type(exc).__name__})"}
            )
    return result