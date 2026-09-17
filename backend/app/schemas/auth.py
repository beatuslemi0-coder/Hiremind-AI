# Tuna-import BaseModel kwa ajili ya kutengeneza Pydantic schemas.
from pydantic import BaseModel, EmailStr


# Schema hii inapokea taarifa za user wakati wa registration.
class RegisterRequest(BaseModel):
    # Email ya user lazima iwe email halali.
    email: EmailStr

    # Password ambayo user atatumia ku-login.
    password: str

    # Role ya user inaweza kuwa interviewee au employer.
    role: str = "interviewee"


# Schema hii inapokea taarifa za login.
class LoginRequest(BaseModel):
    # Email inayotumika kuingia kwenye mfumo.
    email: EmailStr

    # Password ya user.
    password: str


# Schema hii ndiyo response inayorudisha JWT token baada ya login.
class Token(BaseModel):
    # Token ambayo user atatumia kwenye protected endpoints.
    access_token: str

    # Aina ya token.
    token_type: str = "bearer"