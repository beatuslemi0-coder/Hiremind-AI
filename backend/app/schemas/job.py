# Tuna-import Pydantic BaseModel kwa ajili ya request na response schemas.
from pydantic import BaseModel

# Tuna-import datetime kwa ajili ya created_at na updated_at.
from datetime import datetime


# Schema inayotumika employer anapotengeneza job.
class JobCreate(BaseModel):

    # Jina la nafasi ya kazi.
    title: str

    # Maelezo ya kina ya kazi.
    description: str

    # Eneo ambalo kazi ipo.
    location: str

    # Aina ya ajira, mfano Full-time au Internship.
    employment_type: str

    # Kiwango cha elimu kinachohitajika.
    education_required: str | None = None

    # Miaka ya experience inayohitajika.
    experience_required: int | None = None

    # Skills zinazohitajika.
    skills_required: str | None = None


# Schema inayotumika ku-update job.
class JobUpdate(BaseModel):

    # Employer anaweza kubadilisha title.
    title: str | None = None

    # Employer anaweza kubadilisha description.
    description: str | None = None

    # Employer anaweza kubadilisha location.
    location: str | None = None

    # Employer anaweza kubadilisha employment type.
    employment_type: str | None = None

    # Employer anaweza kubadilisha education requirement.
    education_required: str | None = None

    # Employer anaweza kubadilisha experience requirement.
    experience_required: int | None = None

    # Employer anaweza kubadilisha required skills.
    skills_required: str | None = None

    # Employer anaweza kufunga au kufungua job.
    status: str | None = None


# Schema ambayo API itamrudishia user.
class JobResponse(BaseModel):

    # ID ya job.
    id: int

    # ID ya employer.
    employer_id: int

    # Jina la job.
    title: str

    # Maelezo ya job.
    description: str

    # Location ya job.
    location: str

    # Aina ya ajira.
    employment_type: str

    # Education requirement.
    education_required: str | None = None

    # Experience requirement.
    experience_required: int | None = None

    # Required skills.
    skills_required: str | None = None

    # Status ya job.
    status: str

    # Tarehe ya kutengenezwa.
    created_at: datetime

    # Tarehe ya mwisho ya update.
    updated_at: datetime

    # Tunawezesha Pydantic kusoma SQLAlchemy model.
    class Config:
        from_attributes = True