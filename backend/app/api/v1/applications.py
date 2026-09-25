
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.job import Job
from app.models.application import Application

from app.schemas.application import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationStatusUpdate
)


router = APIRouter(
    prefix="/applications",
    tags=["Applications"]
)


# APPLY FOR JOB
@router.post(
    "",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED
)
def apply_for_job(
    data: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Ni interviewee pekee anayeruhusiwa ku-apply kwenye job.
    if current_user.role != "interviewee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only interviewees can apply for jobs."
        )

    # Tunatafuta job ambayo candidate anataka kuomba.
    job = (
        db.query(Job)
        .filter(
            Job.id == data.job_id,
            Job.status == "active"
        )
        .first()
    )

    # Kama job haipo au imefungwa, tunakataa application.
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or job is no longer active."
        )

    # Tunaangalia kama candidate huyu tayari ame-apply kwenye job hii.
    existing_application = (
        db.query(Application)
        .filter(
            Application.job_id == data.job_id,
            Application.candidate_id == current_user.id
        )
        .first()
    )

    # Candidate haruhusiwi ku-apply job moja zaidi ya mara moja.
    if existing_application:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied for this job."
        )

    # Tunatengeneza application mpya.
    application = Application(
        job_id=job.id,
        candidate_id=current_user.id,
        status="pending"
    )

    db.add(application)
    db.commit()
    db.refresh(application)

    return application


# MY APPLICATIONS

@router.get(
    "/my-applications",
    response_model=list[ApplicationResponse]
)
def get_my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Ni interviewee ndiye anayeangalia applications zake.
    if current_user.role != "interviewee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only interviewees can view their applications."
        )

    # Tunatafuta applications zote za candidate aliye-login.
    applications = (
        db.query(Application)
        .filter(
            Application.candidate_id == current_user.id
        )
        .order_by(Application.applied_at.desc())
        .all()
    )

    # Tunamrudishia candidate applications zake.
    return applications


# EMPLOYER VIEW APPLICANTS

@router.get(
    "/job/{job_id}",
    response_model=list[ApplicationResponse]
)
def get_job_applicants(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Ni employer pekee anayeweza kuona applicants wa job yake.
    if current_user.role != "employer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can view job applicants."
        )

    # Tunatafuta job ambayo employer huyu ame-post.
    job = (
        db.query(Job)
        .filter(
            Job.id == job_id,
            Job.employer_id == current_user.id
        )
        .first()
    )

    # Employer hawezi kuona applicants wa job ya employer mwingine.
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found."
        )

    # Tunapata applications zote za job hiyo.
    applications = (
        db.query(Application)
        .filter(
            Application.job_id == job_id
        )
        .order_by(Application.applied_at.desc())
        .all()
    )

    # Tunamrudishia employer applicants wa job yake.
    return applications


# UPDATE APPLICATION STATUS

@router.put(
    "/{application_id}/status",
    response_model=ApplicationResponse
)
def update_application_status(
    application_id: int,
    data: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Ni employer pekee anayeweza kubadilisha status.
    if current_user.role != "employer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can update application status."
        )

    # Tunatafuta application pamoja na job yake.
    application = (
        db.query(Application)
        .join(Job, Application.job_id == Job.id)
        .filter(
            Application.id == application_id,
            Job.employer_id == current_user.id
        )
        .first()
    )

    # Employer hawezi kubadilisha application ya job ya employer mwingine.
    if application is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found."
        )

    # Status tunazoruhusu kwenye mfumo.
    allowed_statuses = [
        "pending",
        "shortlisted",
        "rejected",
        "accepted"
    ]

    # Tunahakikisha status iliyotumwa ni halali.
    if data.status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid application status."
        )

    application.status = data.status

    db.commit()
    db.refresh(application)
    return application


# WITHDRAW APPLICATION

@router.delete(
    "/{application_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def withdraw_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Ni interviewee pekee anayeweza ku-withdraw application yake.
    if current_user.role != "interviewee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only interviewees can withdraw applications."
        )

    # Tunatafuta application ya candidate aliye-login.
    application = (
        db.query(Application)
        .filter(
            Application.id == application_id,
            Application.candidate_id == current_user.id
        )
        .first()
    )

    # Kama application haipo au si yake, tunakataa.
    if application is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found."
        )

    db.delete(application)
    db.commit()

    return None