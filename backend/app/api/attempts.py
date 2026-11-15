from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.course import Course
from app.models.quiz import Quiz
from app.models.question import Question
from app.models.attempt import QuizAttempt
from app.models.attempt_answer import AttemptAnswer
from app.models.user import User
from app.schemas.attempt import (
    QuizAttemptStart,
    QuizAttemptResponse,
    QuizAttemptSubmit,
    QuizAttemptResult,
)

router = APIRouter(prefix="/attempts", tags=["Quiz Attempts"])


# START A QUIZ ATTEMPT
@router.post(
    "/start",
    response_model=QuizAttemptResponse,
    status_code=status.HTTP_201_CREATED,
)
def start_attempt(
    attempt_data: QuizAttemptStart,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quiz = db.get(Quiz, attempt_data.quiz_id)

    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found.",
        )

    course = db.get(Course, quiz.course_id)

    if not course or not course.is_published or not quiz.is_published:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This quiz is not available.",
        )

    attempt = QuizAttempt(
        quiz_id=quiz.id,
        user_id=current_user.id,
    )

    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return attempt


# SUBMIT QUIZ ANSWERS AND CALCULATE SCORE
@router.post(
    "/{attempt_id}/submit",
    response_model=QuizAttemptResult,
)
def submit_attempt(
    attempt_id: int,
    submission: QuizAttemptSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attempt = db.get(QuizAttempt, attempt_id)

    if not attempt or attempt.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz attempt not found.",
        )

    if attempt.submitted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This quiz attempt has already been submitted.",
        )

    questions = db.scalars(
        select(Question).where(
            Question.quiz_id == attempt.quiz_id
        )
    ).all()

    if not questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This quiz has no questions.",
        )

    submitted_ids = [
        answer.question_id for answer in submission.answers
    ]

    if len(submitted_ids) != len(set(submitted_ids)):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Duplicate question answers are not allowed.",
        )

    question_map = {question.id: question for question in questions}

    for answer in submission.answers:
        if answer.question_id not in question_map:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Question {answer.question_id} does not belong to this quiz.",
            )

    answer_map = {
        answer.question_id: answer.selected_answer
        for answer in submission.answers
    }

    score = 0
    total_points = 0

    for question in questions:
        selected_answer = answer_map.get(question.id)

        is_correct = (
            selected_answer is not None
            and selected_answer.strip().casefold()
            == question.correct_answer.strip().casefold()
        )

        points_awarded = question.points if is_correct else 0

        score += points_awarded
        total_points += question.points

        answer_record = AttemptAnswer(
            attempt_id=attempt.id,
            question_id=question.id,
            selected_answer=selected_answer,
            is_correct=is_correct,
            points_awarded=points_awarded,
        )

        db.add(answer_record)

    percentage = round((score / total_points) * 100) if total_points > 0 else 0

    quiz = db.get(Quiz, attempt.quiz_id)

    attempt.score = score
    attempt.total_points = total_points
    attempt.percentage = percentage
    attempt.is_passed = percentage >= quiz.passing_score
    attempt.submitted_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(attempt)

    return QuizAttemptResult(
        attempt_id=attempt.id,
        quiz_id=attempt.quiz_id,
        score=attempt.score,
        total_points=attempt.total_points,
        percentage=attempt.percentage,
        is_passed=attempt.is_passed,
        submitted_at=attempt.submitted_at,
    )


# GET CURRENT USER'S ATTEMPT HISTORY
@router.get(
    "/me",
    response_model=list[QuizAttemptResponse],
)
def get_my_attempts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attempts = db.scalars(
        select(QuizAttempt)
        .where(QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.started_at.desc())
    ).all()

    return attempts


# GET A SINGLE ATTEMPT RESULT
@router.get(
    "/{attempt_id}",
    response_model=QuizAttemptResponse,
)
def get_attempt(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attempt = db.get(QuizAttempt, attempt_id)

    if not attempt or attempt.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz attempt not found.",
        )

    return attempt