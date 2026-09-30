
from fastapi import APIRouter, Depends, HTTPException, status

# SQLAlchemy Session kwa ajili ya database.
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

# Database dependency.
from app.db.session import get_db

# Auth dependency and user model.
from app.api.dependencies import get_current_user
from app.models.user import User

# Schemas za registration na login.
from app.schemas.user import (
    UserCreate,
    UserResponse,
    TokenResponse
)
from app.schemas.auth import LoginRequest

# User service yenye business logic.
from app.services.user_service import UserService

# Function ya kutengeneza JWT.
from app.core.security import create_access_token


# Router ya authentication.
router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# REGISTER
@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register(
    data: UserCreate,
    db: Session = Depends(get_db)
):

    # Tunaita UserService kufanya registration.
    try:
    # Tunaruhusu role mbili tu kwenye public registration.
    # Admin hataruhusiwa kujisajili mwenyewe.
       if data.role not in ["interviewee", "employer"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role must be either interviewee or employer"
            )
       

        # Tunatengeneza user pamoja na role yake.
       return UserService.create_user(
            db=db,
            username=data.username,
            email=data.email,
            password=data.password,
            role=data.role
    )

    # Kama email au username tayari ipo.
    except ValueError as error:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


# LOGIN

@router.get(
    "/me",
    response_model=UserResponse
)
def get_current_user_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return current_user


def _token_for_user(user: User) -> TokenResponse:
    access_token = create_access_token(
        user_id=user.id,
        role=user.role
    )
    return TokenResponse(
        access_token=access_token,
        token_type="bearer"
    )


@router.post(
    "/session",
    response_model=TokenResponse
)
def login_json(
    data: LoginRequest,
    db: Session = Depends(get_db)
):
    user = UserService.authenticate_user(
        db=db,
        email=data.email,
        password=data.password
    )
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return _token_for_user(user)


@router.post(
    "/login",
    response_model=TokenResponse
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    # Tunathibitisha email na password.
    user = UserService.authenticate_user(
        db=db,
        email=form_data.username,  
        password=form_data.password
    )

    # Kama credentials si sahihi.
    if user is None:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        )

    return _token_for_user(user)