# Tuna-import BaseModel kwa ajili ya kutengeneza Pydantic schemas.
from pydantic import BaseModel


# Schema hii inatumika candidate anapoongeza taarifa za elimu.
class EducationCreate(BaseModel):

    # Kiwango cha elimu, mfano Bachelor Degree.
    education_level: str

    # Jina la chuo/shule.
    institution: str

    # Kozi au field aliyoisomea.
    field_of_study: str

    # Mwaka ambao elimu ilianza.
    start_year: int

    # Mwaka ambao elimu ilimalizika.
    # Ni optional kwa sababu candidate anaweza kuwa bado anasoma.
    end_year: int | None = None


# Schema hii inatumika kurudisha taarifa za elimu kwa candidate.
class EducationResponse(BaseModel):

    # ID ya education record.
    id: int

    # ID ya candidate profile inayomiliki education hii.
    profile_id: int

    # Kiwango cha elimu.
    education_level: str

    # Jina la institution.
    institution: str

    # Field ya masomo.
    field_of_study: str

    # Mwaka wa kuanza.
    start_year: int

    # Mwaka wa kumaliza.
    end_year: int | None = None

    # Inaruhusu Pydantic kusoma SQLAlchemy object moja kwa moja.
    class Config:
        from_attributes = True