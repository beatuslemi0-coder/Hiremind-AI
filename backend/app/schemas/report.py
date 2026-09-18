from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReportResponse(BaseModel):
    id: int
    interview_id: int
    overall_score: float
    strengths: str | None
    weaknesses: str | None
    recommendation: str | None
    generated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class InterviewAnswerResponse(BaseModel):
    question_id: int
    question: str
    answer: str
    score: float | None
    feedback: str | None


class EmployerInterviewReportResponse(ReportResponse):
    candidate_id: int
    candidate_name: str
    candidate_email: str
    job_title: str
    answers: list[InterviewAnswerResponse]


class CandidateMessageRequest(BaseModel):
    subject: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=10000)


class CandidateMessageResponse(BaseModel):
    message: str
    recipient: str