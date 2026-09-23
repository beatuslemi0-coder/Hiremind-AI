from pydantic import BaseModel

class CandidateProfileCreate(BaseModel):
    phone_number: str | None = None
    location: str | None = None

class CandidateProfileResponse(BaseModel):
    id: int
    user_id: int
    phone_number: str | None = None
    location: str | None = None

    class Config:
        from_attributes = True