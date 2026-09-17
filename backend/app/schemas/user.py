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

# Schema hii inapokea credentials za user wakati wa login.
class UserLogin(BaseModel):

    # Email ambayo user anatumia ku-login.
    email: EmailStr

    # Password ya user.
    password: str


# Schema hii ndiyo response ya login.
class TokenResponse(BaseModel):

    # JWT access token.
    access_token: str

    # Aina ya authentication.
    token_type: str

