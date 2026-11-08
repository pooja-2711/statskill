
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.course import Course
from app.models.quiz import Quiz
from app.models.question import Question
from app.models.user import User
from app.schemas.quiz import (
    QuizCreate,
    QuizUpdate,
    QuizResponse,
    QuestionCreate,
    QuestionUpdate,
    InstructorQuestionResponse,
    LearnerQuestionResponse,
)


router = APIRouter(prefix="/quizzes", tags=["Quizzes"])


# --------------------------------------------------
# Helper Functions
# --------------------------------------------------

def get_course_or_404(course_id: int, db: Session) -> Course:
    course = db.get(Course, course_id)

    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found.",
        )

    return course


def verify_course_owner(course: Course, current_user: User) -> None:
    if course.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to manage this course.",
        )


def get_quiz_or_404(quiz_id: int, db: Session) -> Quiz:
    quiz = db.get(Quiz, quiz_id)

    if quiz is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found.",
        )

    return quiz


def get_question_or_404(question_id: int, db: Session) -> Question:
    question = db.get(Question, question_id)

    if question is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found.",
        )

    return question


def get_quiz_course(quiz: Quiz, db: Session) -> Course:
    return get_course_or_404(quiz.course_id, db)


def verify_quiz_access(
    quiz: Quiz,
    course: Course,
    current_user: User,
) -> bool:
    """
    Returns True for the course owner.
    Other users can access only published quizzes
    belonging to published courses.
    """

    if course.instructor_id == current_user.id:
        return True

    if not course.is_published or not quiz.is_published:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found.",
        )

    return False


# --------------------------------------------------
# Quiz CRUD Endpoints
# --------------------------------------------------

@router.post(
    "/courses/{course_id}",
    response_model=QuizResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_quiz(
    course_id: int,
    quiz_data: QuizCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = get_course_or_404(course_id, db)

    verify_course_owner(course, current_user)

    if not quiz_data.title.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Quiz title cannot be empty.",
        )

    quiz = Quiz(
        course_id=course_id,
        **quiz_data.model_dump(),
    )

    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    return quiz


@router.get(
    "/courses/{course_id}",
    response_model=list[QuizResponse],
)
def get_course_quizzes(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = get_course_or_404(course_id, db)

    is_owner = course.instructor_id == current_user.id

    query = select(Quiz).where(Quiz.course_id == course_id)

    if not is_owner:
        if not course.is_published:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found.",
            )

        query = query.where(Quiz.is_published.is_(True))

    query = query.order_by(Quiz.created_at.desc())

    return db.scalars(query).all()


@router.get(
    "/{quiz_id}",
    response_model=QuizResponse,
)
def get_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quiz = get_quiz_or_404(quiz_id, db)
    course = get_quiz_course(quiz, db)

    verify_quiz_access(quiz, course, current_user)

    return quiz


@router.put(
    "/{quiz_id}",
    response_model=QuizResponse,
)
def update_quiz(
    quiz_id: int,
    quiz_data: QuizUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quiz = get_quiz_or_404(quiz_id, db)
    course = get_quiz_course(quiz, db)

    verify_course_owner(course, current_user)

    update_data = quiz_data.model_dump(exclude_unset=True)

    if "title" in update_data:
        if update_data["title"] is None or not update_data["title"].strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Quiz title cannot be empty.",
            )

    for field, value in update_data.items():
        setattr(quiz, field, value)

    db.commit()
    db.refresh(quiz)

    return quiz


@router.delete(
    "/{quiz_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quiz = get_quiz_or_404(quiz_id, db)
    course = get_quiz_course(quiz, db)

    verify_course_owner(course, current_user)

    # Delete associated questions explicitly.
    db.execute(
        select(Question).where(Question.quiz_id == quiz_id)
    )
    questions = db.scalars(
        select(Question).where(Question.quiz_id == quiz_id)
    ).all()

    for question in questions:
        db.delete(question)

    db.delete(quiz)
    db.commit()


# --------------------------------------------------
# Question CRUD Endpoints
# --------------------------------------------------

@router.post(
    "/{quiz_id}/questions",
    response_model=InstructorQuestionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_question(
    quiz_id: int,
    question_data: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quiz = get_quiz_or_404(quiz_id, db)
    course = get_quiz_course(quiz, db)

    verify_course_owner(course, current_user)

    if not question_data.question_text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Question text cannot be empty.",
        )

    question = Question(
        quiz_id=quiz_id,
        **question_data.model_dump(),
    )

    db.add(question)
    db.commit()
    db.refresh(question)

    return question


@router.get(
    "/{quiz_id}/questions",
)
def get_quiz_questions(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quiz = get_quiz_or_404(quiz_id, db)
    course = get_quiz_course(quiz, db)

    is_owner = verify_quiz_access(quiz, course, current_user)

    query = (
        select(Question)
        .where(Question.quiz_id == quiz_id)
        .order_by(Question.order_index)
    )

    questions = db.scalars(query).all()

    if is_owner:
        return [
            InstructorQuestionResponse.model_validate(question)
            for question in questions
        ]

    # Never expose correct answers to learners.
    return [
        LearnerQuestionResponse.model_validate(question)
        for question in questions
    ]


@router.put(
    "/questions/{question_id}",
    response_model=InstructorQuestionResponse,
)
def update_question(
    question_id: int,
    question_data: QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    question = get_question_or_404(question_id, db)

    quiz = get_quiz_or_404(question.quiz_id, db)
    course = get_quiz_course(quiz, db)

    verify_course_owner(course, current_user)

    update_data = question_data.model_dump(exclude_unset=True)

    if (
        "question_text" in update_data
        and (
            update_data["question_text"] is None
            or not update_data["question_text"].strip()
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Question text cannot be empty.",
        )

    # Validate the complete question after applying partial updates.
    merged_data = {
        "question_text": question.question_text,
        "question_type": question.question_type,
        "options": question.options,
        "correct_answer": question.correct_answer,
        "points": question.points,
        "order_index": question.order_index,
    }

    merged_data.update(update_data)

    try:
        validated_data = QuestionCreate.model_validate(merged_data)
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=exc.errors(),
        ) from exc

    for field, value in validated_data.model_dump().items():
        setattr(question, field, value)

    db.commit()
    db.refresh(question)

    return question


@router.delete(
    "/questions/{question_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    question = get_question_or_404(question_id, db)

    quiz = get_quiz_or_404(question.quiz_id, db)
    course = get_quiz_course(quiz, db)

    verify_course_owner(course, current_user)

    db.delete(question)
    db.commit()
