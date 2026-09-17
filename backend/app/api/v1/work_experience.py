# Tuna-import tools za FastAPI kwa ajili ya endpoints na authentication.
from fastapi import APIRouter, Depends, HTTPException, status

# Tuna-import Session kwa ajili ya database.
from sqlalchemy.orm import Session

# Dependency ya kupata database session.
from app.db.session import get_db

# Dependency ya kumpata user aliye-login.
from app.api.dependencies import get_current_user

# Model ya User.
from app.models.user import User

# Model ya CandidateProfile.
from app.models.candidate_profile import CandidateProfile

# Model ya WorkExperience.
from app.models.work_experience import WorkExperience

# Schemas za Work Experience.
from app.schemas.work_experience import (
    WorkExperienceCreate,
    WorkExperienceResponse
)


# Tunatengeneza router ya Work Experience.
router = APIRouter(
    prefix="/profile/experience",
    tags=["Candidate Work Experience"]
)


# =========================================================
# 1. CREATE WORK EXPERIENCE
# =========================================================

@router.post(
    "",
    response_model=WorkExperienceResponse,
    status_code=status.HTTP_201_CREATED
)
def create_work_experience(
    experience_data: WorkExperienceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Tunatafuta profile ya candidate aliye-login.
    profile = (
        db.query(CandidateProfile)
        .filter(CandidateProfile.user_id == current_user.id)
        .first()
    )

    # Kama profile haipo, candidate anatakiwa kuitengeneza kwanza.
    if profile is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found. Please create your profile first."
        )

    # Tunatengeneza experience mpya.
    new_experience = WorkExperience(
        profile_id=profile.id,
        job_title=experience_data.job_title,
        company_name=experience_data.company_name,
        description=experience_data.description,
        start_date=experience_data.start_date,
        end_date=experience_data.end_date,
        currently_working=experience_data.currently_working
    )

    # Tunaongeza experience kwenye database.
    db.add(new_experience)

    # Tunahifadhi taarifa.
    db.commit()

    # Tunapakia taarifa mpya pamoja na ID yake.
    db.refresh(new_experience)

    # Tunamrudishia candidate experience yake.
    return new_experience


# =========================================================
# 2. GET MY WORK EXPERIENCES
# =========================================================

@router.get(
    "",
    response_model=list[WorkExperienceResponse]
)
def get_my_work_experiences(
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

    # Tunatafuta experiences zote za candidate huyu.
    experiences = (
        db.query(WorkExperience)
        .filter(WorkExperience.profile_id == profile.id)
        .order_by(WorkExperience.start_date.desc())
        .all()
    )

    # Tunamrudishia candidate experiences zake.
    return experiences


# =========================================================
# 3. UPDATE WORK EXPERIENCE
# =========================================================

@router.put(
    "/{experience_id}",
    response_model=WorkExperienceResponse
)
def update_work_experience(
    experience_id: int,
    experience_data: WorkExperienceCreate,
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

    # Tunatafuta experience inayomilikiwa na candidate huyu.
    experience = (
        db.query(WorkExperience)
        .filter(
            WorkExperience.id == experience_id,
            WorkExperience.profile_id == profile.id
        )
        .first()
    )

    # Kama experience haipo, tunarudisha error.
    if experience is None:
        raise HTTPException(
            status_code=404,
            detail="Work experience not found."
        )

    # Tunabadilisha taarifa za experience.
    experience.job_title = experience_data.job_title
    experience.company_name = experience_data.company_name
    experience.description = experience_data.description
    experience.start_date = experience_data.start_date
    experience.end_date = experience_data.end_date
    experience.currently_working = experience_data.currently_working

    # Tunahifadhi mabadiliko.
    db.commit()

    # Tunapakia taarifa zilizosasishwa.
    db.refresh(experience)

    # Tunamrudishia candidate taarifa mpya.
    return experience


# =========================================================
# 4. DELETE WORK EXPERIENCE
# =========================================================

@router.delete(
    "/{experience_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_work_experience(
    experience_id: int,
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

    # Tunatafuta experience inayomilikiwa na candidate huyu.
    experience = (
        db.query(WorkExperience)
        .filter(
            WorkExperience.id == experience_id,
            WorkExperience.profile_id == profile.id
        )
        .first()
    )

    # Kama experience haipo, tunarudisha error.
    if experience is None:
        raise HTTPException(
            status_code=404,
            detail="Work experience not found."
        )

    # Tunafuta experience kwenye database.
    db.delete(experience)

    # Tunahifadhi deletion.
    db.commit()

    # 204 No Content hairudishi body.
    return None