from sqlalchemy.orm import Session

from app.models.learning_path_course import LearningPathCourse
from app.models.learning_path_enrollment import LearningPathEnrollment


def has_learning_path_enrollment(
    db: Session,
    course_id: int,
    user_id: int,
) -> bool:
    """Return whether the user is enrolled in a path containing this course."""
    enrollment = (
        db.query(LearningPathEnrollment.id)
        .join(
            LearningPathCourse,
            LearningPathCourse.learning_path_id
            == LearningPathEnrollment.learning_path_id,
        )
        .filter(
            LearningPathCourse.course_id == course_id,
            LearningPathEnrollment.user_id == user_id,
        )
        .first()
    )

    return enrollment is not None
