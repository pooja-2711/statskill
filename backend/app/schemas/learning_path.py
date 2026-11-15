from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# CREATE LEARNING PATH
class LearningPathCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str | None = None
    target_level: str = "Beginner"


# UPDATE LEARNING PATH
class LearningPathUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = None
    target_level: str | None = None
    is_published: bool | None = None


# ADD COURSE TO LEARNING PATH
class LearningPathCourseCreate(BaseModel):
    course_id: int
    order_index: int = Field(default=1, ge=1)


# LEARNING PATH COURSE RESPONSE
class LearningPathCourseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    learning_path_id: int
    course_id: int
    order_index: int
    created_at: datetime


# LEARNING PATH RESPONSE
class LearningPathResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    instructor_id: int
    target_level: str
    is_published: bool
    created_at: datetime
    updated_at: datetime