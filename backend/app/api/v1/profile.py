# Tuna-import FastAPI tools kwa ajili ya kutengeneza endpoints.
from fastapi import APIRouter, Depends, HTTPException, status

# SQLAlchemy Session kwa ajili ya kuwasiliana na database.
from sqlalchemy.orm import Session

# Dependencies za database na authenticated user.
from app.db.session import get_db
from app.api.dependencies import get_current_user

# Models tunazohitaji.
from app.models.user import User
from app.models.candidate_profile import CandidateProfile

# Schemas za profile.
from app.schemas.candidate_profile import (
    CandidateProfileCreate,
    CandidateProfileResponse
)


# Tunatengeneza router ya candidate profile.
router = APIRouter(
    prefix="/profile",
    tags=["Candidate Profile"]
)


# Endpoint ya kutengeneza profile ya candidate.
@router.post(
    "",
    response_model=CandidateProfileResponse,
    status_code=status.HTTP_201_CREATED
)
def create_profile(
    profile_data: CandidateProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Tunatafuta kama user huyu tayari ana profile.
    existing_profile = (
        db.query(CandidateProfile)
        .filter(CandidateProfile.user_id == current_user.id)
        .first()
    )

    # Kama profile ipo, hatutengenezi nyingine.
    if existing_profile:
        raise HTTPException(
            status_code=400,
            detail="Candidate profile already exists"
        )

    # Tunatengeneza profile mpya kwa kutumia user aliye-login.
    new_profile = CandidateProfile(
        user_id=current_user.id,
        phone_number=profile_data.phone_number,
        location=profile_data.location
    )

    # Tunaongeza profile kwenye database.
    db.add(new_profile)

    # Tunahifadhi mabadiliko.
    db.commit()

    # Tunapata ID na taarifa nyingine zilizotengenezwa.
    db.refresh(new_profile)

    # Tunamrudishia candidate profile yake.
    return new_profile


# Endpoint ya kupata profile ya candidate aliye-login.
@router.get(
    "",
    response_model=CandidateProfileResponse
)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Tunatafuta profile inayomilikiwa na user aliye-login.
    profile = (
        db.query(CandidateProfile)
        .filter(CandidateProfile.user_id == current_user.id)
        .first()
    )

    # Kama profile haipo, tunarudisha 404.
    if profile is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found"
        )

    # Tunamrudishia candidate profile yake.
    return profile


@router.put(
    "",
    response_model=CandidateProfileResponse
)
def update_profile(
    profile_data: CandidateProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = (
        db.query(CandidateProfile)
        .filter(CandidateProfile.user_id == current_user.id)
        .first()
    )

    if profile is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found"
        )

    profile.phone_number = profile_data.phone_number
    profile.location = profile_data.location

    db.commit()
    db.refresh(profile)

    return profile