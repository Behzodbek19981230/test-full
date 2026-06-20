from pydantic import BaseModel
from typing import Optional


class SubjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    icon: Optional[str] = "📚"
    price_per_question: Optional[int] = 500


class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    price_per_question: Optional[int] = None
    is_active: Optional[bool] = None


class SubjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    icon: str
    price_per_question: int
    is_active: bool
    topic_count: int
    question_count: int
    created_at: Optional[str]
