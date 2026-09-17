from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.interview import Interview


# Schema hii inapokea taarifa zinazohitajika kuanzisha interview.
class InterviewStart(BaseModel):

    # ID ya application ambayo interview inahusishwa nayo.
    application_id: int

    # Jina la interview.
    title: str


class InterviewCreate(BaseModel):
    title: str


class InterviewResponse(BaseModel):
    id: int
    user_id: int
    application_id: int | None = None
    
    status: str
   

    model_config = ConfigDict(
        from_attributes=True
    )

