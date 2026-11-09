from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


# CREATE A SKILL
class SkillCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: str | None = None
    category: str | None = Field(default=None, max_length=100)


# SKILL RESPONSE
class SkillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    category: str | None
    created_at: datetime
    updated_at: datetime


# ADD SKILL TO USER PROFILE
class UserSkillCreate(BaseModel):
    skill_id: int = Field(gt=0)
    proficiency_level: Literal[
        "Beginner",
        "Intermediate",
        "Advanced",
        "Expert",
    ] = "Beginner"


# USER SKILL RESPONSE
class UserSkillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    skill_id: int
    proficiency_level: str
    created_at: datetime
    updated_at: datetime


# UPDATE USER SKILL
class UserSkillUpdate(BaseModel):
    proficiency_level: Literal[
        "Beginner",
        "Intermediate",
        "Advanced",
        "Expert",
    ]