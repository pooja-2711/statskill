
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.course import Course
from app.models.lesson import Lesson
from app.models.lesson_resource import LessonResource
from app.models.user import User
from app.schemas.lesson_resource import (
    LessonResourceCreate,
    LessonResourceUpdate,
    LessonResourceResponse,
)

router = APIRouter(
    prefix="/lesson-resources",
    tags=["Lesson Resources"],
)


def get_lesson_or_404(lesson_id: int, db: Session) -> Lesson:
    lesson = db.get(Lesson, lesson_id)

    if lesson is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found.",
        )

    return lesson


def get_course_or_404(course_id: int, db: Session) -> Course:
    course = db.get(Course, course_id)

    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found.",
        )

    return course


def verify_resource_access(
    lesson: Lesson,
    course: Course,
    current_user: User,
):
    if course.instructor_id == current_user.id:
        return

    if not course.is_published or not lesson.is_preview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found.",
        )


def verify_course_owner(course: Course, current_user: User):
    if course.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to manage resources in this course.",
        )


@router.post(
    "/lessons/{lesson_id}",
    response_model=LessonResourceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_lesson_resource(
    lesson_id: int,
    resource_data: LessonResourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lesson = get_lesson_or_404(lesson_id, db)
    course = get_course_or_404(lesson.course_id, db)

    verify_course_owner(course, current_user)

    resource = LessonResource(
        lesson_id=lesson_id,
        **resource_data.model_dump(),
    )

    db.add(resource)
    db.commit()
    db.refresh(resource)

    return resource


@router.get(
    "/lessons/{lesson_id}",
    response_model=list[LessonResourceResponse],
)
def get_lesson_resources(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lesson = get_lesson_or_404(lesson_id, db)
    course = get_course_or_404(lesson.course_id, db)

    verify_resource_access(lesson, course, current_user)

    statement = (
        select(LessonResource)
        .where(LessonResource.lesson_id == lesson_id)
        .order_by(LessonResource.order_index)
    )

    return db.scalars(statement).all()


@router.put(
    "/{resource_id}",
    response_model=LessonResourceResponse,
)
def update_lesson_resource(
    resource_id: int,
    resource_data: LessonResourceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resource = db.get(LessonResource, resource_id)

    if resource is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found.",
        )

    lesson = get_lesson_or_404(resource.lesson_id, db)
    course = get_course_or_404(lesson.course_id, db)

    verify_course_owner(course, current_user)

    update_data = resource_data.model_dump(exclude_unset=True)

    if "title" in update_data:
        if update_data["title"] is None or not update_data["title"].strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Resource title cannot be empty.",
            )

    for field, value in update_data.items():
        setattr(resource, field, value)

    db.commit()
    db.refresh(resource)

    return resource


@router.delete(
    "/{resource_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_lesson_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resource = db.get(LessonResource, resource_id)

    if resource is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found.",
        )

    lesson = get_lesson_or_404(resource.lesson_id, db)
    course = get_course_or_404(lesson.course_id, db)

    verify_course_owner(course, current_user)

    db.delete(resource)
    db.commit()

    return None
