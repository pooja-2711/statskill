import math
import uuid
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.content import CATEGORIES, ContentItem, ContentSource
from app.models.user import User
from app.schemas.content import (
    ContentItemDetail,
    ContentItemOut,
    ContentListResponse,
    ContentSourceOut,
    ContentSourcesResponse,
)

router = APIRouter(tags=["content"])

IST = ZoneInfo("Asia/Kolkata")
AI_LABEL = "AI-summarised"  # same label the daily ingest writes
NEWSPAPER_KIND = "newspaper"

# publication date, falling back to the fetch date when a feed gave none
_EFFECTIVE_DATE = func.coalesce(ContentItem.published_at, ContentItem.fetched_at)


def _resolve_category(value: str | None) -> str | None:
    if value is None:
        return None
    wanted = value.strip().lower()
    for cat in CATEGORIES:
        if cat.lower() == wanted:
            return cat
    raise HTTPException(
        status_code=422,
        detail=f"Unknown category. Allowed values: {', '.join(CATEGORIES)}",
    )


def _resolve_source_id(db: Session, key: str | None):
    if key is None:
        return None
    source_id = db.scalar(select(ContentSource.id).where(ContentSource.key == key.strip().lower()))
    if source_id is None:
        raise HTTPException(status_code=422, detail="Unknown source key. See GET /content/sources.")
    return source_id


def _date_filters(date_from: date | None, date_to: date | None) -> list:
    if date_from and date_to and date_from > date_to:
        raise HTTPException(status_code=422, detail="date_from must not be after date_to")
    filters = []
    if date_from:
        filters.append(_EFFECTIVE_DATE >= datetime.combine(date_from, time.min, tzinfo=IST))
    if date_to:
        filters.append(
            _EFFECTIVE_DATE < datetime.combine(date_to + timedelta(days=1), time.min, tzinfo=IST)
        )
    return filters


def _to_out(item: ContentItem, source_key: str | None) -> ContentItemOut:
    out = ContentItemOut.model_validate(item)
    out.source_key = source_key
    return out


def _list_items(
    db: Session,
    base_filters: list,
    category: str | None,
    source: str | None,
    date_from: date | None,
    date_to: date | None,
    page: int,
    page_size: int,
) -> ContentListResponse:
    filters = list(base_filters)

    cat = _resolve_category(category)
    if cat:
        filters.append(ContentItem.category == cat)

    source_id = _resolve_source_id(db, source)
    if source_id is not None:
        filters.append(ContentItem.source_id == source_id)

    filters.extend(_date_filters(date_from, date_to))

    total = db.scalar(select(func.count()).select_from(ContentItem).where(*filters)) or 0

    rows = db.execute(
        select(ContentItem, ContentSource.key)
        .outerjoin(ContentSource, ContentItem.source_id == ContentSource.id)
        .where(*filters)
        .order_by(_EFFECTIVE_DATE.desc(), ContentItem.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    total_pages = math.ceil(total / page_size) if total else 0
    return ContentListResponse(
        items=[_to_out(item, key) for item, key in rows],
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages,
        has_next=page < total_pages,
    )


@router.get("/current-affairs", response_model=ContentListResponse)
def list_current_affairs(
    category: str | None = Query(None, max_length=40),
    source: str | None = Query(None, max_length=32, description="Source key from /content/sources"),
    date_from: date | None = None,
    date_to: date | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return _list_items(
        db,
        [ContentItem.label == AI_LABEL],
        category, source, date_from, date_to, page, page_size,
    )


@router.get("/newspapers", response_model=ContentListResponse)
def list_newspapers(
    category: str | None = Query(None, max_length=40),
    source: str | None = Query(None, max_length=32, description="Source key from /content/sources"),
    date_from: date | None = None,
    date_to: date | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    newspaper_ids = select(ContentSource.id).where(ContentSource.kind == NEWSPAPER_KIND)
    return _list_items(
        db,
        [ContentItem.source_id.in_(newspaper_ids)],
        category, source, date_from, date_to, page, page_size,
    )


# declared before /content/{item_id} so "sources" is never read as an id
@router.get("/content/sources", response_model=ContentSourcesResponse)
def list_content_sources(
    include_empty: bool = False,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    rows = db.execute(
        select(ContentSource, func.count(ContentItem.id))
        .outerjoin(ContentItem, ContentItem.source_id == ContentSource.id)
        .where(ContentSource.is_active.is_(True))
        .group_by(ContentSource.id)
        .order_by(ContentSource.name)
    ).all()

    sources = [
        ContentSourceOut(
            key=src.key,
            name=src.name,
            kind=src.kind,
            homepage_url=src.homepage_url,
            item_count=count,
            last_fetched_at=src.last_fetched_at,
            last_status=src.last_status,
        )
        for src, count in rows
        if include_empty or count > 0
    ]
    return ContentSourcesResponse(sources=sources, categories=list(CATEGORIES))


@router.get("/content/{item_id}", response_model=ContentItemDetail)
def get_content_item(
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    row = db.execute(
        select(ContentItem, ContentSource.key, ContentSource.homepage_url)
        .outerjoin(ContentSource, ContentItem.source_id == ContentSource.id)
        .where(ContentItem.id == item_id)
    ).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Article not found")

    item, key, homepage = row
    out = ContentItemDetail.model_validate(item)
    out.source_key = key
    out.source_homepage_url = homepage
    return out