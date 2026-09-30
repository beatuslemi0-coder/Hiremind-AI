from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.interview import Interview

class InterviewStart(BaseModel):

    application_id: int
    title: str


class InterviewCreate(BaseModel):
    title: str


class TextAnswerRequest(BaseModel):
    answer_text: str


class InterviewResponse(BaseModel):
    id: int
    user_id: int
    application_id: int | None = None
    status: str
   
    class Config:
        from_attributes=True
    

