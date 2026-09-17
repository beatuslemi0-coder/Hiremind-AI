# Tuna-import Pydantic BaseModel kwa ajili ya kutengeneza schemas.
from pydantic import BaseModel

# Tuna-import datetime kwa ajili ya muda wa application.
from datetime import datetime


# Schema inayotumika wakati candidate ana-apply kwenye job.
class ApplicationCreate(BaseModel):
    # ID ya job ambayo candidate anataka kuomba.
    job_id: int


# Schema ya kuonyesha taarifa za application.
class ApplicationResponse(BaseModel):
    # ID ya application.
    id: int

    # ID ya job iliyotumikiwa.
    job_id: int

    # ID ya candidate aliyeomba.
    candidate_id: int

    # Hali ya application.
    status: str

    # Muda ambao application iliwasilishwa.
    applied_at: datetime

    # Inaruhusu Pydantic kusoma data moja kwa moja kutoka SQLAlchemy model.
    class Config:
        from_attributes = True


# Schema ambayo employer atatumia kubadilisha status ya application.
class ApplicationStatusUpdate(BaseModel):
    # Status mpya ya application.
    # Mfano: shortlisted, rejected au accepted.
    status: str