
# Tunatumia datetime kutengeneza muda wa expiry wa token.
from datetime import datetime, timedelta, timezone

# JWTError inatusaidia kushughulikia token zisizo sahihi.
from jose import JWTError, jwt

# Argon2 kwa ajili ya password hashing.
from argon2 import PasswordHasher

# Tunapata SECRET_KEY kutoka configuration.
from app.core.config import settings


# PasswordHasher ya Argon2.
password_hasher = PasswordHasher()


# ---------------------------------------------------------
# Kuhash password.
# ---------------------------------------------------------
def hash_password(password: str) -> str:

    # Tunabadilisha password kuwa hash salama.
    return password_hasher.hash(password)


# ---------------------------------------------------------
# Kuhakikisha password ni sahihi.
# ---------------------------------------------------------
def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:

    # Tunajaribu kulinganisha password na hash.
    try:

        # Argon2 inathibitisha password.
        return password_hasher.verify(
            hashed_password,
            plain_password
        )

    # Kama password si sahihi, tunarudisha False.
    except Exception:
        return False


# ---------------------------------------------------------
# Kutengeneza JWT access token.
# ---------------------------------------------------------
def create_access_token(
    user_id: int,
    role: str
) -> str:

    # Token ita-expire baada ya muda huu.
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=60
    )

    # Tunatengeneza payload ya JWT.
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire
    }

    # Tunatengeneza JWT kwa kutumia SECRET_KEY.
    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm="HS256"
    )

