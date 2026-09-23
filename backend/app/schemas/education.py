
from pydantic import BaseModel

class EducationCreate(BaseModel):

    education_level: str
    institution: str
    field_of_study: str
    start_year: int
    end_year: int | None = None

class EducationResponse(BaseModel):
    id: int
    profile_id: int
    education_level: str
    institution: str
    field_of_study: str
    start_year: int
    end_year: int | None = None

    class Config:
        from_attributes = True