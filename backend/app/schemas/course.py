from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class CourseCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10)
    category: str = Field(min_length=2, max_length=100)
    thumbnail_url: HttpUrl | None = None
    price: Decimal = Field(default=Decimal("0.00"), ge=0, max_digits=10, decimal_places=2)
    level: str = Field(default="Beginner", pattern="^(Beginner|Intermediate|Advanced)$")


class CourseUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, min_length=10)
    category: str | None = Field(default=None, min_length=2, max_length=100)
    thumbnail_url: HttpUrl | None = None
    price: Decimal | None = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    level: str | None = Field(default=None, pattern="^(Beginner|Intermediate|Advanced)$")
    is_published: bool | None = None


class CourseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    category: str
    instructor_id: int
    thumbnail_url: str | None
    price: Decimal
    level: str
    is_published: bool
    created_at: datetime
    updated_at: datetime
