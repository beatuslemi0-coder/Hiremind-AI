from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role:str = "interviewee"

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )

class UserLogin(BaseModel):

    email: EmailStr
    password: str

class TokenResponse(BaseModel):

    access_token: str
    token_type: str

