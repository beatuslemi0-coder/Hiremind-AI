# Tuna-import BaseModel kwa ajili ya kutengeneza Pydantic schemas.
from pydantic import BaseModel

# Schema hii inatumika wakati candidate anatengeneza au anabadilisha profile.
class CandidateProfileCreate(BaseModel):

    # Namba ya simu ya candidate.
    phone_number: str | None = None

    # Mahali candidate anapoishi.
    location: str | None = None


# Schema hii inatumika kurudisha profile kwa candidate.
class CandidateProfileResponse(BaseModel):

    # ID ya profile.
    id: int

    # ID ya user anayemiliki profile.
    user_id: int

    # Namba ya simu.
    phone_number: str | None = None

    # Location ya candidate.
    location: str | None = None

    # Pydantic itaruhusu kusoma object ya SQLAlchemy.
    class Config:
        from_attributes = True