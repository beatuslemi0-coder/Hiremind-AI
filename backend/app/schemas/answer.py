from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AnswerCreate(BaseModel):
    answer_text: str


class AnswerResponse(BaseModel):
    id: int
    question_id: int
    answer_text: str
    score: float | None
    ai_feedback: str | None
    answered_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )

