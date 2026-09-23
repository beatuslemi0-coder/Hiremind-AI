from datetime import date
from pydantic import BaseModel

class WorkExperienceCreate(BaseModel):
    job_title: str
    company_name: str
    description: str | None = None
    start_date: date
    end_date: date | None = None

    currently_working: bool = False

class WorkExperienceResponse(BaseModel):
    id: int
    profile_id: int
    job_title: str
    company_name: str
    description: str | None = None
    start_date: date
    end_date: date | None = None

    currently_working: bool

    class Config:
        from_attributes = True