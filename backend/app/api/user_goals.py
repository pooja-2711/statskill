import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.course_discovery import _cached_courses, _response, _save_results
from app.core.dependencies import get_current_user
from app.db.dependencies import get_db
from app.integrations.link_providers import build_link_results
from app.integrations.youtube_quota import QuotaExceeded
from app.integrations.youtube_service import (
    YouTubeAPIError,
    YouTubeNotConfigured,
    search_videos,
)
from app.models.course_discovery import UserGoal
from app.models.user import User
from app.schemas.course_discovery import DiscoveryResponse
from app.schemas.user_goal import GoalCreate, GoalOut, GoalUpdate

router = APIRouter(prefix="/user-goals", tags=["user-goals"])

MAX_GOALS_PER_USER = 20
MIN_CACHE_HITS = 5


def _get_owned(db: Session, goal_id: uuid.UUID, user: User) -> UserGoal:
    goal = db.scalar(
        select(UserGoal).where(
            UserGoal.id == goal_id,
            UserGoal.user_id == user.id,
        )
    )
    if goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


@router.get("", response_model=list[GoalOut])
def list_goals(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return db.scalars(
        select(UserGoal)
        .where(UserGoal.user_id == user.id)
        .order_by(UserGoal.created_at.desc())
    ).all()


@router.post("", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
def create_goal(
    payload: GoalCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    count = db.scalar(
        select(func.count()).select_from(UserGoal).where(UserGoal.user_id == user.id)
    )
    if count >= MAX_GOALS_PER_USER:
        raise HTTPException(
            status_code=409,
            detail=f"Goal limit reached ({MAX_GOALS_PER_USER}). Delete one first.",
        )

    goal = UserGoal(
        user_id=user.id,
        title=payload.title,
        topic=payload.topic,
        level=payload.level,
        target_date=payload.target_date,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.patch("/{goal_id}", response_model=GoalOut)
def update_goal(
    goal_id: uuid.UUID,
    payload: GoalUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    goal = _get_owned(db, goal_id, user)
    data = payload.model_dump(exclude_unset=True)

    if "title" in data and data["title"] is None:
        raise HTTPException(status_code=422, detail="title cannot be null")

    for field, value in data.items():
        setattr(goal, field, value)

    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    goal = _get_owned(db, goal_id, user)
    db.delete(goal)
    db.commit()
    return None


@router.get("/{goal_id}/recommendations", response_model=DiscoveryResponse)
def goal_recommendations(
    goal_id: uuid.UUID,
    limit: int = Query(10, ge=1, le=25),
    refresh: bool = False,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    goal = _get_owned(db, goal_id, user)

    q = (goal.topic or goal.title).strip()[:100]
    if len(q) < 2:
        raise HTTPException(
            status_code=422,
            detail="Goal needs a longer title or topic to find courses.",
        )

    links = build_link_results(q)
    cached = _cached_courses(db, q, goal.topic, goal.level, None, limit)

    if not refresh and len(cached) >= min(limit, MIN_CACHE_HITS):
        return _response(q, "cache", cached, links)

    yt_query = f"{q} {goal.level}" if goal.level else q
    try:
        items = search_videos(yt_query, max_results=limit, topic=goal.topic, level=goal.level)
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