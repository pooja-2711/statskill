from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.user import User
from app.models.course import Course
from app.models.learning_path import LearningPath
from app.models.learning_path_course import LearningPathCourse
from app.schemas.learning_path import (
    LearningPathCreate,
    LearningPathUpdate,
    LearningPathCourseCreate,
    LearningPathResponse,
    LearningPathCourseResponse,
)
from app.schemas.learning_path_enrollment import (
    LearningPathEnrollmentResponse,
    LearningPathProgressResponse,
)

from app.models.learning_path_enrollment import LearningPathEnrollment
from app.models.lesson import Lesson
from app.models.progress import Progress
from datetime import datetime, timezone
router = APIRouter(
    prefix="/learning-paths",
    tags=["Learning Paths"],
)
# CREATE LEARNING PATH
@router.post(
    "/",
    response_model=LearningPathResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_learning_path(
    path_data: LearningPathCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    learning_path = LearningPath(
        title=path_data.title,
        description=path_data.description,
        target_level=path_data.target_level,
        instructor_id=current_user.id,
    )

    db.add(learning_path)
    db.commit()
    db.refresh(learning_path)

    return learning_path
# LIST LEARNING PATHS
@router.get(
    "/",
    response_model=list[LearningPathResponse],
)
def get_learning_paths(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(LearningPath)
        .filter(
            (LearningPath.instructor_id == current_user.id)
            | (LearningPath.is_published == True)
        )
        .order_by(LearningPath.created_at.desc())
        .all()
    )
# GET SINGLE LEARNING PATH
@router.get(
    "/{path_id}",
    response_model=LearningPathResponse,
)
def get_learning_path(
    path_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    learning_path = (
        db.query(LearningPath)
        .filter(LearningPath.id == path_id)
        .first()
    )

    if not learning_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning path not found.",
        )

    if (
        learning_path.instructor_id != current_user.id
        and not learning_path.is_published
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this learning path.",
        )

    return learning_path
# UPDATE LEARNING PATH
@router.put(
    "/{path_id}",
    response_model=LearningPathResponse,
)
def update_learning_path(
    path_id: int,
    path_data: LearningPathUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    learning_path = (
        db.query(LearningPath)
        .filter(LearningPath.id == path_id)
        .first()
    )

    if not learning_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning path not found.",
        )

    if learning_path.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the instructor can update this learning path.",
        )

    update_data = path_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(learning_path, field, value)

    db.commit()
    db.refresh(learning_path)

    return learning_path
# DELETE LEARNING PATH
@router.delete(
    "/{path_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_learning_path(
    path_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    learning_path = (
        db.query(LearningPath)
        .filter(LearningPath.id == path_id)
        .first()
    )

    if not learning_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning path not found.",
        )

    if learning_path.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the instructor can delete this learning path.",
        )

    db.delete(learning_path)
    db.commit()

    return None
# ADD COURSE TO LEARNING PATH
@router.post(
    "/{path_id}/courses",
    response_model=LearningPathCourseResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_course_to_learning_path(
    path_id: int,
    course_data: LearningPathCourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    learning_path = (
        db.query(LearningPath)
        .filter(LearningPath.id == path_id)
        .first()
    )

    if not learning_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning path not found.",
        )

    if learning_path.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the instructor can add courses.",
        )

    course = (
        db.query(Course)
        .filter(Course.id == course_data.course_id)
        .first()
    )

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found.",
        )

    if course.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only add your own courses.",
        )

    existing = (
        db.query(LearningPathCourse)
        .filter(
            LearningPathCourse.learning_path_id == path_id,
            LearningPathCourse.course_id == course_data.course_id,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Course already exists in this learning path.",
        )

    path_course = LearningPathCourse(
        learning_path_id=path_id,
        course_id=course_data.course_id,
        order_index=course_data.order_index,
    )

    db.add(path_course)
    db.commit()
    db.refresh(path_course)

    return path_course
# LIST COURSES IN A LEARNING PATH
@router.get(
    "/{path_id}/courses",
    response_model=list[LearningPathCourseResponse],
)
def get_learning_path_courses(
    path_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    learning_path = (
        db.query(LearningPath)
        .filter(LearningPath.id == path_id)
        .first()
    )

    if not learning_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning path not found.",
        )

    if (
        learning_path.instructor_id != current_user.id
        and not learning_path.is_published
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this learning path.",
        )

    return (
        db.query(LearningPathCourse)
        .filter(LearningPathCourse.learning_path_id == path_id)
        .order_by(LearningPathCourse.order_index.asc())
        .all()
    )
# REMOVE COURSE FROM LEARNING PATH
@router.delete(
    "/{path_id}/courses/{course_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_course_from_learning_path(
    path_id: int,
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    learning_path = (
        db.query(LearningPath)
        .filter(LearningPath.id == path_id)
        .first()
    )

    if not learning_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning path not found.",
        )

    if learning_path.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the instructor can remove courses.",
        )

    path_course = (
        db.query(LearningPathCourse)
        .filter(
            LearningPathCourse.learning_path_id == path_id,
            LearningPathCourse.course_id == course_id,
        )
        .first()
    )

    if not path_course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found in this learning path.",
        )

    db.delete(path_course)
    db.commit()

    return None
# ENROLL IN A LEARNING PATH
@router.post(
    "/{path_id}/enroll",
    response_model=LearningPathEnrollmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def enroll_in_learning_path(
    path_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    learning_path = (
        db.query(LearningPath)
        .filter(LearningPath.id == path_id)
        .first()
    )

    if not learning_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning path not found.",
        )

    if not learning_path.is_published:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot enroll in an unpublished learning path.",
        )

    if learning_path.instructor_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Instructors cannot enroll in their own learning paths.",
        )

    existing_enrollment = (
        db.query(LearningPathEnrollment)
        .filter(
            LearningPathEnrollment.learning_path_id == path_id,
            LearningPathEnrollment.user_id == current_user.id,
        )
        .first()
    )

    if existing_enrollment:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You are already enrolled in this learning path.",
        )

    enrollment = LearningPathEnrollment(
        learning_path_id=path_id,
        user_id=current_user.id,
    )

    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)

    return enrollment
# GET CURRENT USER'S LEARNING PATH ENROLLMENTS
@router.get(
    "/me/enrollments",
    response_model=list[LearningPathEnrollmentResponse],
)
def get_my_learning_path_enrollments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    enrollments = (
        db.query(LearningPathEnrollment)
        .filter(
            LearningPathEnrollment.user_id == current_user.id
        )
        .order_by(LearningPathEnrollment.enrolled_at.desc())
        .all()
    )

    return enrollments
# GET LEARNING PATH PROGRESS
@router.get(
    "/{path_id}/progress",
    response_model=LearningPathProgressResponse,
)
def get_learning_path_progress(
    path_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    learning_path = (
        db.query(LearningPath)
        .filter(LearningPath.id == path_id)
        .first()
    )

    if not learning_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning path not found.",
        )

    enrollment = (
        db.query(LearningPathEnrollment)
        .filter(
            LearningPathEnrollment.learning_path_id == path_id,
            LearningPathEnrollment.user_id == current_user.id,
        )
        .first()
    )

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must enroll in this learning path to view progress.",
        )

    path_courses = (
        db.query(LearningPathCourse)
        .filter(LearningPathCourse.learning_path_id == path_id)
        .all()
    )

    course_ids = [item.course_id for item in path_courses]
    total_courses = len(course_ids)

    if course_ids:
        total_lessons = (
            db.query(Lesson)
            .filter(Lesson.course_id.in_(course_ids))
            .count()
        )

        completed_lessons = (
            db.query(Progress)
            .join(Lesson, Progress.lesson_id == Lesson.id)
            .filter(
                Progress.user_id == current_user.id,
                Progress.is_completed.is_(True),
                Lesson.course_id.in_(course_ids),
            )
            .count()
        )
    else:
        total_lessons = 0
        completed_lessons = 0

    progress_percentage = (
        round((completed_lessons / total_lessons) * 100, 2)
        if total_lessons > 0
        else 0.0
    )

    is_completed = (
        total_lessons > 0
        and completed_lessons == total_lessons
    )

    if is_completed and not enrollment.is_completed:
        enrollment.is_completed = True
        enrollment.completed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(enrollment)

    return LearningPathProgressResponse(
        learning_path_id=learning_path.id,
        learning_path_title=learning_path.title,
        total_courses=total_courses,
        total_lessons=total_lessons,
        completed_lessons=completed_lessons,
        progress_percentage=progress_percentage,
        is_completed=is_completed,
        enrolled_at=enrollment.enrolled_at,
        completed_at=enrollment.completed_at,
    )