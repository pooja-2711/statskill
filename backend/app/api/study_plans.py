
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.study_task import StudyTask
from app.models.user import User
from app.schemas.study_task import (
    StudyTaskCreate,
    StudyTaskOut,
    StudyTaskUpdate,
)

router = APIRouter(prefix="/study-plans", tags=["Study Plans"])


def _get_owned(
    db: Session,
    task_id: uuid.UUID,
    user: User,
) -> StudyTask:
    task = db.scalar(
        select(StudyTask).where(
            StudyTask.id == task_id,
            StudyTask.user_id == user.id,
        )
    )

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    return task


@router.get("", response_model=list[StudyTaskOut])
def list_tasks(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return db.scalars(
        select(StudyTask)
        .where(StudyTask.user_id == user.id)
        .order_by(
            StudyTask.done,
            StudyTask.due_date.is_(None),
            StudyTask.due_date,
            StudyTask.created_at,
        )
    ).all()


@router.post(
    "",
    response_model=StudyTaskOut,
    status_code=status.HTTP_201_CREATED,
)
def create_task(
    payload: StudyTaskCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = StudyTask(
        user_id=user.id,
        title=payload.title,
        due_date=payload.due_date,
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    return task


@router.patch("/{task_id}", response_model=StudyTaskOut)
def update_task(
    task_id: uuid.UUID,
    payload: StudyTaskUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = _get_owned(db, task_id, user)

    data = payload.model_dump(exclude_unset=True)

    for field, value in data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)

    return task


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_task(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = _get_owned(db, task_id, user)

    db.delete(task)
    db.commit()

    return None
