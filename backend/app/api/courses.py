
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.course import Course
from app.models.user import User
from app.schemas.course import CourseCreate, CourseUpdate, CourseResponse


router = APIRouter(prefix="/courses", tags=["Courses"])


@router.post(
    "",
    response_model=CourseResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_course(
    course_data: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a course owned by the authenticated instructor."""

    course_values = course_data.model_dump()

    if course_values.get("thumbnail_url") is not None:
       course_values["thumbnail_url"] = str(course_values["thumbnail_url"])

    course = Course(
        **course_values,
        instructor_id=current_user.id,
    )

    db.add(course)
    db.commit()
    db.refresh(course)

    return course


@router.get("", response_model=list[CourseResponse])
def get_courses(
    db: Session = Depends(get_db),
):
    """Return all published courses."""

    statement = select(Course).where(Course.is_published.is_(True))
    courses = db.scalars(statement).all()

    return courses


@router.get("/{course_id}", response_model=CourseResponse)
def get_course(
    course_id: int,
    db: Session = Depends(get_db),
):
    """Return a published course by its ID."""

    course = db.get(Course, course_id)

    if course is None or not course.is_published:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found.",
        )

    return course


@router.put("/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: int,
    course_data: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a course owned by the authenticated instructor."""

    course = db.get(Course, course_id)

    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found.",
        )

    if course.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to update this course.",
        )

    update_data = course_data.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No update fields were provided.",
        )

    if (
        "thumbnail_url" in update_data
        and update_data["thumbnail_url"] is not None
    ):
        update_data["thumbnail_url"] = str(update_data["thumbnail_url"])

    for field, value in update_data.items():
        setattr(course, field, value)

    db.commit()
    db.refresh(course)

    return course


@router.delete(
    "/{course_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a course owned by the authenticated instructor."""

    course = db.get(Course, course_id)

    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found.",
        )

    if course.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this course.",
        )

    db.delete(course)
    db.commit()

    return None
