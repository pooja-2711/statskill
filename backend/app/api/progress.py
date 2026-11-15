
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.dependencies import get_db
from app.core.dependencies import get_current_user

from app.models.user import User
from app.models.course import Course
from app.models.lesson import Lesson
from app.models.progress import Progress

from app.schemas.progress import (
    LessonProgressResponse,
    CourseProgressResponse,
    OverallProgressResponse,
)


router = APIRouter(prefix="/progress", tags=["Progress Tracking"])


# MARK A LESSON AS COMPLETED
@router.post(
    "/lessons/{lesson_id}/complete",
    response_model=LessonProgressResponse,
)
def complete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lesson = db.query(Lesson).filter(
        Lesson.id == lesson_id
    ).first()

    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found",
        )

    course = db.query(Course).filter(
        Course.id == lesson.course_id
    ).first()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    # Only the instructor or a learner accessing a published course
    # can mark a lesson as completed.
    if (
        course.instructor_id != current_user.id
        and not course.is_published
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This course is not available",
        )

    progress = db.query(Progress).filter(
        Progress.user_id == current_user.id,
        Progress.lesson_id == lesson_id,
    ).first()

    if not progress:
        progress = Progress(
            user_id=current_user.id,
            lesson_id=lesson_id,
            is_completed=True,
            completed_at=datetime.now(timezone.utc),
        )
        db.add(progress)
    else:
        progress.is_completed = True

        if not progress.completed_at:
            progress.completed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(progress)

    return progress


# GET PROGRESS FOR A SPECIFIC COURSE
@router.get(
    "/courses/{course_id}",
    response_model=CourseProgressResponse,
)
def get_course_progress(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = db.query(Course).filter(
        Course.id == course_id
    ).first()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    if (
        course.instructor_id != current_user.id
        and not course.is_published
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This course is not available",
        )

    total_lessons = (
        db.query(func.count(Lesson.id))
        .filter(Lesson.course_id == course_id)
        .scalar()
        or 0
    )

    completed_lessons = (
        db.query(func.count(Progress.id))
        .join(Lesson, Progress.lesson_id == Lesson.id)
        .filter(
            Lesson.course_id == course_id,
            Progress.user_id == current_user.id,
            Progress.is_completed.is_(True),
        )
        .scalar()
        or 0
    )

    completion_percentage = (
        (completed_lessons / total_lessons) * 100
        if total_lessons > 0
        else 0.0
    )

    return CourseProgressResponse(
        course_id=course_id,
        total_lessons=total_lessons,
        completed_lessons=completed_lessons,
        completion_percentage=round(completion_percentage, 2),
    )


# GET OVERALL LEARNING PROGRESS
@router.get(
    "/me",
    response_model=OverallProgressResponse,
)
def get_overall_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Count distinct courses in which the user has progress records.
    user_course_ids = (
        db.query(Lesson.course_id)
        .join(Progress, Progress.lesson_id == Lesson.id)
        .filter(Progress.user_id == current_user.id)
        .distinct()
        .subquery()
    )

    total_courses = (
        db.query(func.count())
        .select_from(user_course_ids)
        .scalar()
        or 0
    )

    # Count lessons in those courses.
    total_lessons = (
        db.query(func.count(Lesson.id))
        .filter(Lesson.course_id.in_(
            db.query(user_course_ids.c.course_id)
        ))
        .scalar()
        or 0
    )

    # Count completed lessons belonging to the current user.
    completed_lessons = (
        db.query(func.count(Progress.id))
        .join(Lesson, Progress.lesson_id == Lesson.id)
        .filter(
            Progress.user_id == current_user.id,
            Progress.is_completed.is_(True),
            Lesson.course_id.in_(
                db.query(user_course_ids.c.course_id)
            ),
        )
        .scalar()
        or 0
    )

    completion_percentage = (
        (completed_lessons / total_lessons) * 100
        if total_lessons > 0
        else 0.0
    )

    return OverallProgressResponse(
        total_courses=total_courses,
        total_lessons=total_lessons,
        completed_lessons=completed_lessons,
        completion_percentage=round(completion_percentage, 2),
    )
