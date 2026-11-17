import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.dependencies import get_db
from app.integrations.gemini_quiz import (
    GeminiNotConfigured,
    GeminiQuizError,
    generate_quiz,
)
from app.models.course_discovery import CourseQuiz, ExternalCourse
from app.models.user import User
from app.schemas.course_quiz import CourseQuizOut

router = APIRouter(prefix="/course-discovery", tags=["course-quizzes"])


def _get_course(db: Session, course_id: uuid.UUID) -> ExternalCourse:
    course = db.get(ExternalCourse, course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


def _latest_quiz(db: Session, course_id: uuid.UUID) -> CourseQuiz | None:
    return db.scalar(
        select(CourseQuiz)
        .where(CourseQuiz.course_id == course_id)
        .order_by(CourseQuiz.created_at.desc())
        .limit(1)
    )


@router.get("/courses/{course_id}/quiz", response_model=CourseQuizOut)
def get_course_quiz(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    _get_course(db, course_id)
    quiz = _latest_quiz(db, course_id)
    if quiz is None:
        raise HTTPException(status_code=404, detail="No quiz generated for this course yet")
    return quiz


@router.post("/courses/{course_id}/quiz", response_model=CourseQuizOut)
def generate_course_quiz(
    course_id: uuid.UUID,
    num_questions: int = Query(5, ge=3, le=10),
    regenerate: bool = False,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    course = _get_course(db, course_id)

    existing = _latest_quiz(db, course_id)
    if existing is not None and not regenerate:
        return existing

    try:
        generated, model_name = generate_quiz(
            title=course.title,
            description=course.description,
            channel=course.channel_or_org,
            topic=course.topic,
            level=course.level,
            num_questions=num_questions,
        )
    except GeminiNotConfigured:
        raise HTTPException(status_code=503, detail="AI quiz generation is not configured.")
    except GeminiQuizError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)

    quiz = CourseQuiz(
        course_id=course.id,
        questions=[q.model_dump() for q in generated.questions],
        is_ai_generated=True,
        model_name=model_name,
    )
    db.add(quiz)
    db.flush()

    # keep only the newest quiz per course
    db.execute(
        delete(CourseQuiz).where(
            CourseQuiz.course_id == course.id,
            CourseQuiz.id != quiz.id,
        )
    )
    db.commit()
    db.refresh(quiz)
    return quiz