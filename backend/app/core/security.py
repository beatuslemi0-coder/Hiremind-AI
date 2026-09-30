from datetime import datetime, timedelta, timezone
# JWTError inatusaidia kushughulikia token zisizo sahihi.
from jose import JWTError, jwt
from argon2 import PasswordHasher
from app.core.config import settings


password_hasher = PasswordHasher()

def hash_password(password: str) -> str:

    return password_hasher.hash(password)

def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:

    try:

        return password_hasher.verify(
            hashed_password,
            plain_password
        )

    except Exception:
        return False

def create_access_token(
    user_id: int,
    role: str
) -> str:

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=60
    )

    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire
    }
    
    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm="HS256"
    )

