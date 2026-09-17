# Tunatumia FastAPI Depends kwa ajili ya kupata
# dependencies kama database session na authentication.
from fastapi import Depends, HTTPException, status

# Tunatumia OAuth2PasswordBearer kusoma Bearer Token
# ambayo user anaituma baada ya login.
from fastapi.security import OAuth2PasswordBearer,OAuth2PasswordRequestForm

# SQLAlchemy Session inatumika kuwasiliana na PostgreSQL.
from sqlalchemy.orm import Session

# JWTError inatumika kushughulikia token ambayo si sahihi.
from jose import JWTError, jwt

# Tunapata database session.
from app.db.session import get_db

# Tunapata User model.
from app.models.user import User


# Tunapata application settings kama SECRET_KEY.
from app.core.config import settings
from app.schemas.user import TokenResponse


# Hii inaeleza FastAPI kwamba token itapatikana
# kwenye Authorization header kama:
# Authorization: Bearer <token>
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login"
)




# Hii function inapata user aliye-login
# kwa kutumia JWT token.
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:

    # Hii ni error tutakayotumia kama token
    # haiwezi kuthibitishwa.
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={
            "WWW-Authenticate": "Bearer"
        }
    )

    # Tunajaribu kusoma na kuthibitisha JWT token.
    try:

        # Tunadecode token kwa kutumia SECRET_KEY.
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=["HS256"]
        )

        # Tunachukua user ID kutoka kwenye token.
        user_id = payload.get("sub")

        # Kama user ID haipo kwenye token,
        # token inachukuliwa kuwa si sahihi.
        if user_id is None:
            raise credentials_exception

    # Kama JWT token ina tatizo, tunarudisha 401.
    except JWTError:
        raise credentials_exception

    # Tunatafuta user kwenye PostgreSQL kwa kutumia ID.
    user = db.get(
        User,
        int(user_id)
    )

    # Kama user hayupo kwenye database,
    # authentication inakataliwa.
    if user is None:
        raise credentials_exception

    # Kama kila kitu kiko sawa, tunarudisha
    # user aliye-login.
    return user

# Function hii inazuia user ambaye hana role inayotakiwa
# kutumia endpoint fulani.
def require_role(required_role: str):

    # Hii ndiyo dependency inayokagua role ya user.
    def role_checker(
        current_user: User = Depends(get_current_user)
    ):

        # Tunalinganisha role ya user na role inayotakiwa.
        if current_user.role != required_role:

            # Kama role hairuhusiwi, tunarudisha 403.
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource"
            )

        # Kama role inaruhusiwa, tunamrudisha user.
        return current_user

    # Tunareturn dependency yenye role requirement.
    return role_checker