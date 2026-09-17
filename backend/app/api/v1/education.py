# Tuna-import APIRouter kwa ajili ya kutengeneza endpoints.
from fastapi import APIRouter, Depends, HTTPException, status

# Tuna-import Session kwa ajili ya kuwasiliana na database.
from sqlalchemy.orm import Session

# Dependency ya kupata database session.
from app.db.session import get_db

# Dependency ya kumpata user aliye-login.
from app.api.dependencies import get_current_user

# Model ya User.
from app.models.user import User

# Model ya CandidateProfile.
from app.models.candidate_profile import CandidateProfile

# Model ya Education.
from app.models.education import Education

# Schemas za Education.
from app.schemas.education import EducationCreate, EducationResponse


# Tunatengeneza router ya Candidate Education.
router = APIRouter(
    prefix="/profile/education",
    tags=["Candidate Education"]
)


# =========================================================
# 1. CREATE EDUCATION
# =========================================================

@router.post(
    "",
    response_model=EducationResponse,
    status_code=status.HTTP_201_CREATED
)
def create_education(
    education_data: EducationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Tunatafuta profile ya candidate aliye-login.
    profile = (
        db.query(CandidateProfile)
        .filter(CandidateProfile.user_id == current_user.id)
        .first()
    )

    # Kama profile haipo, candidate anatakiwa ku-create profile kwanza.
    if profile is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found. Please create your profile first."
        )

    # Tunatengeneza education mpya.
    new_education = Education(
        profile_id=profile.id,
        education_level=education_data.education_level,
        institution=education_data.institution,
        field_of_study=education_data.field_of_study,
        start_year=education_data.start_year,
        end_year=education_data.end_year
    )

    # Tunaongeza education kwenye database.
    db.add(new_education)

    # Tunahifadhi mabadiliko.
    db.commit()

    # Tunapata ID na taarifa nyingine zilizotengenezwa.
    db.refresh(new_education)

    # Tunamrudishia candidate education yake.
    return new_education


# =========================================================
# 2. GET MY EDUCATION
# =========================================================

@router.get(
    "",
    response_model=list[EducationResponse]
)
def get_my_education(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Tunatafuta profile ya candidate aliye-login.
    profile = (
        db.query(CandidateProfile)
        .filter(CandidateProfile.user_id == current_user.id)
        .first()
    )

    # Kama profile haipo, tunarudisha error.
    if profile is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found."
        )

    # Tunatafuta education zote zinazohusiana na profile hii.
    educations = (
        db.query(Education)
        .filter(Education.profile_id == profile.id)
        .order_by(Education.start_year.desc())
        .all()
    )

    # Tunamrudishia candidate list ya education zake.
    return educations


# =========================================================
# 3. UPDATE EDUCATION
# =========================================================

@router.put(
    "/{education_id}",
    response_model=EducationResponse
)
def update_education(
    education_id: int,
    education_data: EducationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Tunatafuta profile ya candidate aliye-login.
    profile = (
        db.query(CandidateProfile)
        .filter(CandidateProfile.user_id == current_user.id)
        .first()
    )

    # Kama profile haipo, tunarudisha error.
    if profile is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found."
        )

    # Tunatafuta education inayohusiana na profile ya user huyu.
    education = (
        db.query(Education)
        .filter(
            Education.id == education_id,
            Education.profile_id == profile.id
        )
        .first()
    )

    # Kama education haipo, tunarudisha error.
    if education is None:
        raise HTTPException(
            status_code=404,
            detail="Education record not found."
        )

    # Tunabadilisha taarifa za education.
    education.education_level = education_data.education_level
    education.institution = education_data.institution
    education.field_of_study = education_data.field_of_study
    education.start_year = education_data.start_year
    education.end_year = education_data.end_year

    # Tunahifadhi mabadiliko kwenye database.
    db.commit()

    # Tunapata taarifa mpya kutoka database.
    db.refresh(education)

    # Tunamrudishia candidate education iliyoboreshwa.
    return education


# =========================================================
# 4. DELETE EDUCATION
# =========================================================

@router.delete(
    "/{education_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_education(
    education_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Tunatafuta profile ya candidate aliye-login.
    profile = (
        db.query(CandidateProfile)
        .filter(CandidateProfile.user_id == current_user.id)
        .first()
    )

    # Kama profile haipo, tunarudisha error.
    if profile is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found."
        )

    # Tunatafuta education inayomilikiwa na candidate huyu.
    education = (
        db.query(Education)
        .filter(
            Education.id == education_id,
            Education.profile_id == profile.id
        )
        .first()
    )

    # Kama education haipo, tunarudisha error.
    if education is None:
        raise HTTPException(
            status_code=404,
            detail="Education record not found."
        )

    # Tunafuta education kutoka database.
    db.delete(education)

    # Tunahifadhi deletion.
    db.commit()

    # 204 No Content haipaswi kurudisha body.
    return None