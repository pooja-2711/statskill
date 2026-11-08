from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.course import Course
from app.models.lesson import Lesson
from app.models.user import User
from app.schemas.lesson import LessonCreate, LessonUpdate, LessonResponse


router = APIRouter(prefix="/lessons", tags=["Lessons"])


def get_course_or_404(course_id: int, db: Session) -> Course:
    course = db.get(Course, course_id)

    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found.",
        )

    return course


def verify_course_owner(course: Course, current_user: User):
    if course.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to manage lessons in this course.",
        )


@router.post(
    "/courses/{course_id}",
    response_model=LessonResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_lesson(
    course_id: int,
    lesson_data: LessonCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = get_course_or_404(course_id, db)
    verify_course_owner(course, current_user)

    lesson = Lesson(
        course_id=course_id,
        **lesson_data.model_dump(),
    )

    db.add(lesson)
    db.commit()
    db.refresh(lesson)

    return lesson


@router.get(
    "/courses/{course_id}",
    response_model=list[LessonResponse],
)
def get_course_lessons(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = get_course_or_404(course_id, db)

    if course.instructor_id == current_user.id:
        statement = (
            select(Lesson)
            .where(Lesson.course_id == course_id)
            .order_by(Lesson.order_index)
        )
    else:
        if not course.is_published:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found.",
            )

        statement = (
            select(Lesson)
            .where(
                Lesson.course_id == course_id,
                Lesson.is_preview.is_(True),
            )
            .order_by(Lesson.order_index)
        )

    return db.scalars(statement).all()


@router.get(
    "/{lesson_id}",
    response_model=LessonResponse,
)
def get_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lesson = db.get(Lesson, lesson_id)

    if lesson is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found.",
        )

    course = get_course_or_404(lesson.course_id, db)

    if course.instructor_id != current_user.id:
        if not course.is_published or not lesson.is_preview:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found.",
            )

    return lesson


@router.put(
    "/{lesson_id}",
    response_model=LessonResponse,
)
def update_lesson(
    lesson_id: int,
    lesson_data: LessonUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lesson = db.get(Lesson, lesson_id)

    if lesson is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found.",
        )

    course = get_course_or_404(lesson.course_id, db)
    verify_course_owner(course, current_user)

    update_data = lesson_data.model_dump(exclude_unset=True)

    if "title" in update_data and not update_data["title"].strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Lesson title cannot be empty.",
        )

    for field, value in update_data.items():
        setattr(lesson, field, value)

    db.commit()
    db.refresh(lesson)

    return lesson


@router.delete(
    "/{lesson_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lesson = db.get(Lesson, lesson_id)

    if lesson is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found.",
        )

    course = get_course_or_404(lesson.course_id, db)
    verify_course_owner(course, current_user)

    db.delete(lesson)
    db.commit()

    return None