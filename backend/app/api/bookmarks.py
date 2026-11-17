
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.bookmark import Bookmark
from app.models.user import User
from app.schemas.bookmark import BookmarkCreate, BookmarkOut, BookmarkUpdate

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])


def _get_owned(db: Session, bookmark_id: uuid.UUID, user: User) -> Bookmark:
    bm = db.scalar(
        select(Bookmark).where(
            Bookmark.id == bookmark_id,
            Bookmark.user_id == user.id,
        )
    )
    if bm is None:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    return bm


@router.get("", response_model=list[BookmarkOut])
def list_bookmarks(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return db.scalars(
        select(Bookmark)
        .where(Bookmark.user_id == user.id)
        .order_by(Bookmark.created_at.desc())
    ).all()


@router.post("", response_model=BookmarkOut, status_code=status.HTTP_201_CREATED)
def create_bookmark(
    payload: BookmarkCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    bm = Bookmark(
        user_id=user.id,
        title=payload.title,
        url=payload.url,
        note=(payload.note or "").strip() or None,
    )
    db.add(bm)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="This URL is already bookmarked",
        )

    db.refresh(bm)
    return bm


@router.patch("/{bookmark_id}", response_model=BookmarkOut)
def update_bookmark(
    bookmark_id: uuid.UUID,
    payload: BookmarkUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    bm = _get_owned(db, bookmark_id, user)
    data = payload.model_dump(exclude_unset=True)

    if "title" in data and data["title"] is not None:
        data["title"] = data["title"].strip()

    if "note" in data:
        data["note"] = (data["note"] or "").strip() or None

    for field, value in data.items():
        setattr(bm, field, value)

    db.commit()
    db.refresh(bm)
    return bm


@router.delete("/{bookmark_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bookmark(
    bookmark_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    bm = _get_owned(db, bookmark_id, user)
    db.delete(bm)
    db.commit()
    return None
