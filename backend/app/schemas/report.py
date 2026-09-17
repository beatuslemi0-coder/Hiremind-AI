from datetime import datetime

from pydantic import BaseModel, ConfigDict


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