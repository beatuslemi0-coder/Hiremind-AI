from datetime import datetime
from pydantic import BaseModel, Field  


class AttentionMetricCreate(BaseModel):
    
    gaze_deviation_deg: float | None = Field(
        default=None,
        ge=0
    )
    
    face_detected: bool = False
    off_screen:bool = False
    
class AttentionMetricResponse(BaseModel):
    id: int
    interview_id: int
    gaze_deviation_deg: float | None
    face_detected: bool
    off_screen: bool
    recorded_at: datetime
    
    class Config:
        from_attributes = True
        
class AttentionSessionResponse(BaseModel):
    """
    Schema hii inarudisha taarifa za attention session
    iliyoanzishwa kwa interview.
    """

    id: int
    interview_id: int
    started_at: datetime
    ended_at: datetime | None
    is_active: bool

    class Config:
        from_attributes = True
    
    