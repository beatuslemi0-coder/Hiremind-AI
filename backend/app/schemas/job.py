
from pydantic import BaseModel
from datetime import datetime

class JobCreate(BaseModel):

    title: str
    description: str
    location: str
    employment_type: str
    education_required: str | None = None
    experience_required: int | None = None
    skills_required: str | None = None

class JobUpdate(BaseModel):

    title: str | None = None
    description: str | None = None
    location: str | None = None
    employment_type: str | None = None
    education_required: str | None = None
    experience_required: int | None = None
    skills_required: str | None = None
    status: str | None = None

class JobResponse(BaseModel):

    id: int
    employer_id: int
    title: str
    description: str
    location: str
    employment_type: str
    education_required: str | None = None
    experience_required: int | None = None
    skills_required: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True