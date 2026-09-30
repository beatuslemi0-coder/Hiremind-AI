from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from pydantic import BaseModel, ConfigDict

class QuestionCreate(BaseModel):
    question_text: str
    question_type: str = "technical"
    order_number: int

class QuestionResponse(BaseModel):
    id: int
    interview_id: int
    question_text: str
    question_type: str
    order_number: int
    created_at: datetime

    class Config:
        from_attributes=True
    

