import re
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.dependencies import get_db
from app.integrations.link_providers import build_link_results, list_providers
from app.integrations.youtube_quota import QuotaExceeded
from app.integrations.youtube_service import (
    YouTubeAPIError,
    YouTubeNotConfigured,
    search_videos,
)
from app.models.course_discovery import ExternalCourse
from app.models.user import User
from app.schemas.course_discovery import (
    DiscoveryResponse,
    ExternalCourseOut,
    Level,
)

router = APIRouter(prefix="/course-discovery", tags=["course-discovery"])

CACHE_TTL = timedelta(days=7)
MIN_CACHE_HITS = 5  # serve from cache only when it has at least min(limit, this) matches


def _terms(q: str) -> list[str]:
    # letters/digits only, so no LIKE wildcard characters can get through
    return [t for t in re.findall(r"[^\W_]+", q.lower()) if len(t) >= 2][:6]


def _cached_courses(
    db: Session,
    q: str,
    topic: str | None,
    level: str | None,
    free: bool | None,
    limit: int,
) -> list[ExternalCourse]:
    cutoff = datetime.now(timezone.utc) - CACHE_TTL
    stmt = select(ExternalCourse).where(
        ExternalCourse.provider == "youtube",
        ExternalCourse.fetched_at >= cutoff,
    )
    for term in _terms(q):
        pattern = f"%{term}%"
        stmt = stmt.where(
            or_(
                ExternalCourse.title.ilike(pattern),
                ExternalCourse.description.ilike(pattern),
            )
        )
    if topic:
        stmt = stmt.where(func.lower(ExternalCourse.topic) == topic.lower())
    if level:
        stmt = stmt.where(ExternalCourse.level == level)
    if free is not None:
        stmt = stmt.where(ExternalCourse.is_free == free)
    stmt = stmt.order_by(ExternalCourse.fetched_at.desc()).limit(limit)
    return list(db.scalars(stmt).all())


def _find(db: Session, provider: str, external_id: str) -> ExternalCourse | None:
    return db.scalar(
        select(ExternalCourse).where(
            ExternalCourse.provider == provider,
            ExternalCourse.external_id == external_id,
        )
    )


def _save_results(db: Session, items: list[dict]) -> list[ExternalCourse]:
    saved: list[ExternalCourse] = []
    now = datetime.now(timezone.utc)

    for item in items:
        obj: ExternalCourse | None = None
        try:
            with db.begin_nested():
                obj = _find(db, item["provider"], item["external_id"])
                if obj is not None:
                    obj.title = item["title"]
                    obj.description = item["description"]
                    obj.url = item["url"]
                    obj.thumbnail_url = item["thumbnail_url"]
                    obj.channel_or_org = item["channel_or_org"]
                    obj.fetched_at = now
                    if item.get("topic") is not None:
                        obj.topic = item["topic"]
                    if item.get("level") is not None:
                        obj.level = item["level"]
                else:
                    obj = ExternalCourse(**item)
                    db.add(obj)
                db.flush()
        except IntegrityError:
            # another request inserted the same video first; load that row instead
            obj = _find(db, item["provider"], item["external_id"])
        if obj is not None:
            saved.append(obj)

    db.commit()
    return saved


def _response(
    q: str,
    source: str,
    courses: list[ExternalCourse],
    links: list[dict],
    notice: str | None = None,
) -> DiscoveryResponse:
    return DiscoveryResponse(
        query=q,
        source=source,
        count=len(courses),
        courses=[ExternalCourseOut.model_validate(c) for c in courses],
        link_providers=links,
        notice=notice,
    )


@router.get("/providers")
def get_providers(_: User = Depends(get_current_user)):
    return list_providers()


@router.get("/search", response_model=DiscoveryResponse)
def search_courses(
    q: str = Query(..., min_length=2, max_length=100),
    topic: str | None = Query(None, max_length=100),
    level: Level | None = None,
    free: bool | None = None,
    limit: int = Query(10, ge=1, le=25),
    refresh: bool = False,
    providers: str | None = Query(
        None, max_length=100, description="Comma-separated link providers, e.g. coursera,nptel"
    ),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = q.strip()
    if len(q) < 2:
        raise HTTPException(status_code=422, detail="Query is too short")
    topic = topic.strip() if topic else None

    only = [p.strip() for p in providers.split(",") if p.strip()] if providers else None
    links = build_link_results(q, only=only)

    # YouTube content is always free, so a paid-only filter leaves nothing to fetch
    if free is False:
        return _response(
            q, "cache", [], links,
            "YouTube results are all free. Showing link-only providers instead.",
        )

    cached = _cached_courses(db, q, topic, level, free, limit)
    if not refresh and len(cached) >= min(limit, MIN_CACHE_HITS):
        return _response(q, "cache", cached, links)

    yt_query = f"{q} {level}" if level else q
    try:
        items = search_videos(yt_query, max_results=limit, topic=topic, level=level)
    except (QuotaExceeded, YouTubeNotConfigured, YouTubeAPIError) as exc:
        if isinstance(exc, QuotaExceeded):
            status_code, detail = 429, "Daily course search budget reached. Try again later."
        elif isinstance(exc, YouTubeNotConfigured):
            status_code, detail = 503, "Video search is not configured."
        else:
            status_code, detail = exc.status_code, exc.message

        if cached:
            return _response(
                q, "cache_fallback", cached, links,
                "Live video search is unavailable right now. Showing saved results.",
            )
        raise HTTPException(status_code=status_code, detail=detail)

    saved = _save_results(db, items)
    return _response(q, "youtube", saved, links)


@router.get("/courses/{course_id}", response_model=ExternalCourseOut)
def get_course(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    course = db.get(ExternalCourse, course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return course