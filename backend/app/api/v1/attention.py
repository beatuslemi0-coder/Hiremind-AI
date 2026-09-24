from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models.attention_session import AttentionSession

from app.api.dependencies import get_db, get_current_user
from app.models.attention_metric import AttentionMetric
from app.models.interview import Interview
from app.schemas.attention import (
    AttentionMetricCreate,
    AttentionMetricResponse,
    AttentionSessionResponse,
)


router = APIRouter(
    prefix="/interviews",
    tags=["Interview Attention"]
)


@router.post(
    "/{interview_id}/attention/metrics",
    response_model=AttentionMetricResponse,
    status_code=status.HTTP_201_CREATED
)
def create_attention_metric(
    interview_id: int,
    metric: AttentionMetricCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Endpoint hii inapokea attention data kutoka kwenye
    camera/model ya AI na kuihifadhi kwenye database.
    """

    # Tunatafuta interview inayohusiana na request.
    interview = (
        db.query(Interview)
        .filter(Interview.id == interview_id)
        .first()
    )

    # Kama interview haipo, tunarudisha 404.
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )

    # Tunahakikisha candidate anayepokea metric
    # ndiye owner wa interview.
    if interview.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to access this interview"
        )

    # Tunatengeneza metric mpya.
    attention_metric = AttentionMetric(
        interview_id=interview.id,
        gaze_deviation_deg=metric.gaze_deviation_deg,
        face_detected=metric.face_detected,
        off_screen=metric.off_screen,
    )

    db.add(attention_metric)
    db.commit()
    db.refresh(attention_metric)

    return attention_metric

@router.get(
    "/{interview_id}/attention",
    response_model=list[AttentionMetricResponse]
)
def get_attention_metrics(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Endpoint hii inarudisha attention metrics zote
    zilizokusanywa wakati wa interview.
    """

    # Tunatafuta interview kwa kutumia ID iliyotumwa.
    interview = (
        db.query(Interview)
        .filter(Interview.id == interview_id)
        .first()
    )

    # Kama interview haipo, tunarudisha 404.
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )

    # Tunahakikisha user anayeomba data ndiye mwenye interview.
    if interview.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to access this interview"
        )

    # Tunachukua attention metrics zote za interview hii.
    metrics = (
        db.query(AttentionMetric)
        .filter(
            AttentionMetric.interview_id == interview_id
        )
        .order_by(AttentionMetric.recorded_at.asc())
        .all()
    )

    # Tunairudisha list ya metrics kwa frontend/report.
    return metrics

@router.post(
    "/{interview_id}/attention/start",
    response_model=AttentionSessionResponse,
    status_code=status.HTTP_201_CREATED
)
def start_attention_session(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Endpoint hii inaanzisha attention monitoring
    kwa interview husika.
    """

    # Tunatafuta interview inayohusishwa na ID iliyotumwa.
    interview = (
        db.query(Interview)
        .filter(Interview.id == interview_id)
        .first()
    )

    # Kama interview haipo, tunarudisha 404.
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )

    # Tunahakikisha candidate ndiye mwenye interview hii.
    if interview.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to access this interview"
        )

    # Tunaangalia kama kuna attention session ambayo bado inaendelea.
    active_session = (
        db.query(AttentionSession)
        .filter(
            AttentionSession.interview_id == interview_id,
            AttentionSession.is_active == True
        )
        .first()
    )

    # Haturuhusu kuanzisha sessions mbili kwa interview moja kwa wakati mmoja.
    if active_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attention monitoring is already active"
        )

    # Tunatengeneza session mpya ya attention monitoring.
    attention_session = AttentionSession(
        interview_id=interview_id,
        is_active=True
    )

    # Tuna-save session kwenye database.
    db.add(attention_session)
    db.commit()
    db.refresh(attention_session)

    # Tunamrudishia frontend taarifa za session iliyoanza.
    return attention_session

