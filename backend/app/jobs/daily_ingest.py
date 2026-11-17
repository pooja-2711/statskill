import hashlib
import re
import time
from urllib.parse import urlparse

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.db.session import SessionLocal
from app.integrations.category_rules import classify
from app.integrations.groq_summarizer import LABEL as AI_LABEL, summarise_items
from app.integrations.rss_ingest import FeedItem, fetch_source
from app.models.content import ContentItem, ContentSource

SECTION_NEWSPAPER = "newspaper"
SECTION_CURRENT_AFFAIRS = "current_affairs"
NEWSPAPER_LABEL = "Newspaper"


def make_hash(url: str, title: str) -> str:
    """Host + normalized headline, so tracking parameters and repeat feeds don't create duplicates."""
    host = urlparse(url).netloc.lower().split(":")[0].removeprefix("www.")
    norm = re.sub(r"\W+", " ", (title or "").lower()).strip()
    return hashlib.sha256(f"{host}|{norm}".encode("utf-8")).hexdigest()


def _prepare(item: FeedItem, source_id, enriched) -> dict:
    ai_summary = enriched.summary if enriched else None
    if enriched:
        category = enriched.category
    else:
        category = classify(item.title, item.summary, item.feed_url)

    is_ai = bool(ai_summary)
    return {
        "source_id": source_id,
        "source_name": item.source_name[:100],
        "section": SECTION_CURRENT_AFFAIRS if is_ai else SECTION_NEWSPAPER,
        "title": item.title[:500],
        "summary": ai_summary if is_ai else item.summary,   # RSS snippet when there is no AI summary
        "url": item.url,
        "category": category,
        "label": AI_LABEL if is_ai else NEWSPAPER_LABEL,
        "published_at": item.published_at,                  # None stays None, never guessed
        "dedupe_hash": make_hash(item.url, item.title),
    }


def run_daily_ingest(ai_limit: int = 40) -> dict:
    started = time.monotonic()
    stats: dict = {"sources": {}, "ai": {}, "saved": {}}

    # 1) load the active newspaper sources, then release the session before any network work
    db = SessionLocal()
    try:
        rows = db.execute(
            select(ContentSource.id, ContentSource.key, ContentSource.name, ContentSource.feed_urls).where(
                ContentSource.is_active.is_(True), ContentSource.kind == "newspaper"
            )
        ).all()
        sources = [(r.id, r.key, r.name, list(r.feed_urls or [])) for r in rows]
    finally:
        db.close()
    sources = [s for s in sources if s[3]]

    # 2) fetch every feed; a dead feed or source never stops the job
    all_items: list[FeedItem] = []
    source_status: dict = {}
    key_to_id = {}
    for sid, key, name, urls in sources:
        res = fetch_source(key, name, urls)
        all_items.extend(res.items)
        key_to_id[key] = sid
        source_status[sid] = (res.status, res.error_summary)
        stats["sources"][key] = {"status": res.status, "items": len(res.items), "error": res.error_summary}

    # 3) Groq summaries and categories for the most recent items (best effort)
    enriched_by_url: dict = {}
    try:
        ai = summarise_items(all_items, limit=ai_limit)
        enriched_by_url = {e.feed.url: e for e in ai.enriched}
        stats["ai"] = {
            "selected": ai.selected,
            "batches_ok": ai.batches_ok,
            "batches_failed": ai.batches_failed,
            "with_summary": sum(1 for e in ai.enriched if e.summary),
            "dropped": dict(ai.dropped),
            "stopped_reason": ai.stopped_reason,
        }
    except Exception as exc:
        stats["ai"] = {"error": f"summariser failed ({type(exc).__name__})"}

    # 4) save with a fresh session
    prepared = [_prepare(it, key_to_id[it.source_key], enriched_by_url.get(it.url)) for it in all_items]
    new = upgraded = duplicates = 0

    db = SessionLocal()
    try:
        hashes = [p["dedupe_hash"] for p in prepared]
        existing = {}
        if hashes:
            existing = {
                c.dedupe_hash: c
                for c in db.scalars(select(ContentItem).where(ContentItem.dedupe_hash.in_(hashes)))
            }

        seen: set[str] = set()
        for p in prepared:
            h = p["dedupe_hash"]
            if h in seen:
                duplicates += 1
                continue
            seen.add(h)

            current = existing.get(h)
            if current is not None:
                if p["label"] == AI_LABEL and current.label != AI_LABEL:
                    current.summary = p["summary"]
                    current.label = p["label"]
                    current.section = p["section"]
                    current.category = p["category"]
                    upgraded += 1
                else:
                    duplicates += 1
                continue

            try:
                with db.begin_nested():
                    db.add(ContentItem(**p))
                    db.flush()
                new += 1
            except IntegrityError:
                duplicates += 1  # another run saved it first

        now_utc = time.time()
        from datetime import datetime, timezone

        stamp = datetime.fromtimestamp(now_utc, tz=timezone.utc)
        for sid, (status, error) in source_status.items():
            src = db.get(ContentSource, sid)
            if src is not None:
                src.last_fetched_at = stamp
                src.last_status = status
                src.last_error = error
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    stats["saved"] = {
        "fetched": len(all_items),
        "new": new,
        "upgraded_to_ai": upgraded,
        "duplicates_skipped": duplicates,
    }
    stats["seconds"] = round(time.monotonic() - started, 1)
    return stats