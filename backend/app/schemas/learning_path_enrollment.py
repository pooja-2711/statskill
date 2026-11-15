from datetime import datetime

from pydantic import BaseModel, ConfigDict


class LearningPathEnrollmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    learning_path_id: int
    user_id: int
    is_completed: bool
    enrolled_at: datetime
    completed_at: datetime | None


class LearningPathProgressResponse(BaseModel):
    learning_path_id: int
    learning_path_title: str
    total_courses: int
    total_lessons: int
    completed_lessons: int
    progress_percentage: float
    is_completed: bool
    enrolled_at: datetime
    completed_at: datetime | None