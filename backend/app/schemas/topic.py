from pydantic import BaseModel
from typing import Optional


class TopicCreate(BaseModel):
    subject_id: int
    name: str
    description: Optional[str] = ""
    is_mixed: Optional[bool] = False


class TopicUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    order_num: Optional[int] = None
    is_active: Optional[bool] = None
    is_mixed: Optional[bool] = None


class QuestionCreate(BaseModel):
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str


class QuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_option: Optional[str] = None


class BulkQuestionsCreate(BaseModel):
    questions: list[QuestionCreate]
