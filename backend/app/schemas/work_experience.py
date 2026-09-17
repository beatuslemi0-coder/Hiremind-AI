# Tuna-import BaseModel kwa ajili ya kutengeneza Pydantic schemas.
from pydantic import BaseModel

# Tuna-import date kwa ajili ya tarehe za kuanza na kumaliza kazi.
from datetime import date


# Schema hii inatumika kupokea taarifa mpya za experience.
class WorkExperienceCreate(BaseModel):
    # Jina la nafasi ambayo candidate alifanya kazi.
    job_title: str

    # Jina la kampuni/organization.
    company_name: str

    # Maelezo ya majukumu ya kazi.
    description: str | None = None

    # Tarehe ambayo kazi ilianza.
    start_date: date

    # Tarehe ambayo kazi iliisha; inaweza kuwa tupu kama bado anafanya kazi.
    end_date: date | None = None

    # Inaonyesha kama candidate bado anafanya kazi hapo.
    currently_working: bool = False


# Schema hii ndiyo taarifa tunazomrudishia candidate.
class WorkExperienceResponse(BaseModel):
    # ID ya experience.
    id: int

    # ID ya candidate profile inayomiliki experience hii.
    profile_id: int

    # Jina la nafasi ya kazi.
    job_title: str

    # Jina la kampuni.
    company_name: str

    # Maelezo ya kazi.
    description: str | None = None

    # Tarehe ya kuanza kazi.
    start_date: date

    # Tarehe ya kumaliza kazi.
    end_date: date | None = None

    # Kama bado anafanya kazi.
    currently_working: bool

    # Tunaambia Pydantic isome data moja kwa moja kutoka SQLAlchemy model.
    class Config:
        from_attributes = True