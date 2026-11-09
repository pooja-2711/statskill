from datetime import datetime

from pydantic import BaseModel, ConfigDict


class LessonProgressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    lesson_id: int
    is_completed: bool
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class CourseProgressResponse(BaseModel):
    course_id: int
    total_lessons: int
    completed_lessons: int
    completion_percentage: float


class OverallProgressResponse(BaseModel):
    total_courses: int
    total_lessons: int
    completed_lessons: int
    completion_percentage: float