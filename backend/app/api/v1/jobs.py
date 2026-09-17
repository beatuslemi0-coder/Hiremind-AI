# Tuna-import FastAPI tools kwa ajili ya endpoints na authentication.
from fastapi import APIRouter, Depends, HTTPException, status

# Tuna-import SQLAlchemy Session kwa ajili ya database.
from sqlalchemy.orm import Session

# Dependency ya kupata database session.
from app.db.session import get_db

# Dependency ya kumpata user aliye-login.
from app.api.dependencies import get_current_user

# User model.
from app.models.user import User

# Job model.
from app.models.job import Job

# Job schemas.
from app.schemas.job import JobCreate, JobUpdate, JobResponse


# Router ya jobs.
router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"]
)

# ============================================================
# 1. CREATE JOB
# ============================================================

@router.post(
    "",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED
)
def create_job(
    job_data: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Tunahakikisha user huyu ni employer.
    if current_user.role != "employer":
        raise HTTPException(
            status_code=403,
            detail="Only employers can create jobs."
        )

    # Tunatengeneza job mpya na kuihusisha na employer aliye-login.
    new_job = Job(
        employer_id=current_user.id,
        title=job_data.title,
        description=job_data.description,
        location=job_data.location,
        employment_type=job_data.employment_type,
        education_required=job_data.education_required,
        experience_required=job_data.experience_required,
        skills_required=job_data.skills_required
    )

    # Tunaongeza job kwenye database.
    db.add(new_job)

    # Tunahifadhi mabadiliko.
    db.commit()

    # Tunapata taarifa zote za job pamoja na ID.
    db.refresh(new_job)

    # Tunamrudishia employer job iliyotengenezwa.
    return new_job


# ============================================================
# 2. GET ALL ACTIVE JOBS
# ============================================================

@router.get(
    "",
    response_model=list[JobResponse]
)
def get_all_jobs(
    db: Session = Depends(get_db)
):
    # Tunatafuta jobs ambazo bado ziko active.
    jobs = (
        db.query(Job)
        .filter(Job.status == "active")
        .order_by(Job.created_at.desc())
        .all()
    )

    # Tunamrudishia user jobs zote active.
    return jobs


# ============================================================
# 3. GET ONE JOB
# ============================================================

@router.get(
    "/{job_id}",
    response_model=JobResponse
)
def get_job(
    job_id: int,
    db: Session = Depends(get_db)
):
    # Tunatafuta job kwa kutumia ID.
    job = (
        db.query(Job)
        .filter(Job.id == job_id)
        .first()
    )

    # Kama job haipo, tunarudisha 404.
    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found."
        )

    # Tunamrudishia user taarifa za job.
    return job


# ============================================================
# 4. GET EMPLOYER'S JOBS
# ============================================================

@router.get(
    "/employer/my-jobs",
    response_model=list[JobResponse]
)
def get_my_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Tunahakikisha user ni employer.
    if current_user.role != "employer":
        raise HTTPException(
            status_code=403,
            detail="Only employers can view their jobs."
        )

    # Tunatafuta jobs zote za employer huyu.
    jobs = (
        db.query(Job)
        .filter(Job.employer_id == current_user.id)
        .order_by(Job.created_at.desc())
        .all()
    )

    # Tunamrudishia employer jobs zake.
    return jobs


# ============================================================
# 5. UPDATE JOB
# ============================================================

@router.put(
    "/{job_id}",
    response_model=JobResponse
)
def update_job(
    job_id: int,
    job_data: JobUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Tunahakikisha user ni employer.
    if current_user.role != "employer":
        raise HTTPException(
            status_code=403,
            detail="Only employers can update jobs."
        )

    # Tunatafuta job inayomilikiwa na employer huyu.
    job = (
        db.query(Job)
        .filter(
            Job.id == job_id,
            Job.employer_id == current_user.id
        )
        .first()
    )

    # Kama job haipo au si ya employer huyu, tunarudisha 404.
    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found."
        )

    # Tunabadilisha fields ambazo employer ametuma.
    if job_data.title is not None:
        job.title = job_data.title

    if job_data.description is not None:
        job.description = job_data.description

    if job_data.location is not None:
        job.location = job_data.location

    if job_data.employment_type is not None:
        job.employment_type = job_data.employment_type

    if job_data.education_required is not None:
        job.education_required = job_data.education_required

    if job_data.experience_required is not None:
        job.experience_required = job_data.experience_required

    if job_data.skills_required is not None:
        job.skills_required = job_data.skills_required

    if job_data.status is not None:
        job.status = job_data.status

    # Tunahifadhi mabadiliko.
    db.commit()

    # Tunapata taarifa mpya kutoka database.
    db.refresh(job)

    # Tunamrudishia employer job iliyosasishwa.
    return job


# ============================================================
# 6. DELETE JOB
# ============================================================

@router.delete(
    "/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Tunahakikisha user ni employer.
    if current_user.role != "employer":
        raise HTTPException(
            status_code=403,
            detail="Only employers can delete jobs."
        )

    # Tunatafuta job inayomilikiwa na employer huyu.
    job = (
        db.query(Job)
        .filter(
            Job.id == job_id,
            Job.employer_id == current_user.id
        )
        .first()
    )

    # Kama job haipo, tunarudisha 404.
    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found."
        )

    # Tunafuta job.
    db.delete(job)

    # Tunahifadhi deletion.
    db.commit()

    # 204 No Content hairudishi body.
    return None