from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models.attention_session import AttentionSession
from datetime import datetime
from app.models.attention_event import AttentionEvent

from app.api.dependencies import get_db, get_current_user
from app.models.attention_metric import AttentionMetric
from app.models.interview import Interview
from app.schemas.attention import (
    AttentionMetricCreate,
    AttentionMetricResponse,
    AttentionSessionResponse,
    AttentionSummaryResponse,
    AttentionEventResponse,
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

@router.post(
    "/{interview_id}/attention/stop",
    response_model=AttentionSessionResponse
)
def stop_attention_session(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Endpoint hii inasitisha attention monitoring
    ya interview husika.
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

    # Tunatafuta attention session ambayo bado iko active.
    active_session = (
        db.query(AttentionSession)
        .filter(
            AttentionSession.interview_id == interview_id,
            AttentionSession.is_active == True
        )
        .first()
    )

    # Kama hakuna session inayoendelea, hakuna kitu cha kusitisha.
    if not active_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active attention session found"
        )

    # Tunaweka muda ambao monitoring ilisimama.
    active_session.ended_at = datetime.now()

    # Tunaonyesha kwamba monitoring haipo active tena.
    active_session.is_active = False

    # Tuna-save mabadiliko kwenye database.
    db.commit()
    db.refresh(active_session)

    # Tunamrudishia frontend taarifa za session iliyositishwa.
    return active_session

@router.get(
    "/{interview_id}/attention/summary",
    response_model=AttentionSummaryResponse
)
def get_attention_summary(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Endpoint hii inahesabu summary ya attention
    kwa interview nzima.
    """

    # Tunatafuta interview husika.
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

    # Tunahakikisha user ndiye mwenye interview hii.
    if interview.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to access this interview"
        )

    # Tunapata attention session zote za interview hii.
    sessions = (
        db.query(AttentionSession)
        .filter(
            AttentionSession.interview_id == interview_id
        )
        .all()
    )

    # Tunapata attention metrics zote za interview hii.
    metrics = (
        db.query(AttentionMetric)
        .filter(
            AttentionMetric.interview_id == interview_id
        )
        .all()
    )

    # Tunaanza kuhesabu jumla ya muda wa monitoring.
    monitoring_duration_sec = 0.0

    # Tunapitia sessions zote.
    for session in sessions:

        # Session iliyomalizika ina started_at na ended_at.
        if session.started_at and session.ended_at:

            # Tunapata tofauti ya muda kwa seconds.
            duration = (
                session.ended_at - session.started_at
            ).total_seconds()

            # Tunaongeza duration kwenye jumla.
            monitoring_duration_sec += duration

    # Jumla ya metrics.
    total_metrics = len(metrics)

    # Tunahesabu metrics ambazo face ilionekana.
    face_detected_count = sum(
        1 for metric in metrics
        if metric.face_detected
    )

    # Tunahesabu metrics ambazo face haikuonekana.
    face_not_detected_count = sum(
        1 for metric in metrics
        if not metric.face_detected
    )

    # Tunahesabu metrics ambazo candidate alikuwa off-screen.
    off_screen_count = sum(
        1 for metric in metrics
        if metric.off_screen
    )

    # Tunachukua gaze values ambazo haziko NULL.
    gaze_values = [
        metric.gaze_deviation_deg
        for metric in metrics
        if metric.gaze_deviation_deg is not None
    ]

    # Kama kuna gaze values, tunapata average.
    average_gaze_deviation_deg = (
        sum(gaze_values) / len(gaze_values)
        if gaze_values
        else None
    )

    # Tunairudisha summary kwa frontend/report.
    return AttentionSummaryResponse(
        interview_id=interview_id,
        monitoring_duration_sec=monitoring_duration_sec,
        total_metrics=total_metrics,
        face_detected_count=face_detected_count,
        face_not_detected_count=face_not_detected_count,
        off_screen_count=off_screen_count,
        average_gaze_deviation_deg=average_gaze_deviation_deg,
    )
    
@router.post(
    "/{interview_id}/attention/events/start",
    response_model=AttentionEventResponse,
    status_code=status.HTTP_201_CREATED
)
def start_attention_event(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Endpoint hii inaanzisha attention event,
    kwa mfano candidate kuwa off-screen.
    """

    # Tunatafuta interview husika.
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

    # Tunahakikisha candidate ndiye mwenye interview.
    if interview.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to access this interview"
        )

    # Tunaangalia kama kuna off-screen event ambayo bado inaendelea.
    active_event = (
        db.query(AttentionEvent)
        .filter(
            AttentionEvent.interview_id == interview_id,
            AttentionEvent.event_type == "off_screen",
            AttentionEvent.is_active == True
        )
        .first()
    )

    # Haturuhusu event mbili za off-screen kuendelea kwa wakati mmoja.
    if active_event:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An off-screen event is already active"
        )

    # Tunatengeneza event mpya.
    attention_event = AttentionEvent(
        interview_id=interview_id,
        event_type="off_screen",
        started_at=datetime.now(),
        is_active=True
    )

    # Tuna-save event kwenye database.
    db.add(attention_event)
    db.commit()
    db.refresh(attention_event)

    # Tunamrudishia frontend event iliyoanzishwa.
    return attention_event

@router.post(
    "/{interview_id}/attention/events/stop",
    response_model=AttentionEventResponse
)
def stop_attention_event(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Endpoint hii inasitisha off-screen event
    na kuhesabu muda ambao event ilidumu.
    """

    # Tunatafuta interview husika.
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

    # Tunatafuta off-screen event ambayo bado inaendelea.
    active_event = (
        db.query(AttentionEvent)
        .filter(
            AttentionEvent.interview_id == interview_id,
            AttentionEvent.event_type == "off_screen",
            AttentionEvent.is_active == True
        )
        .first()
    )

    # Kama hakuna event active, hakuna cha kusitisha.
    if not active_event:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active off-screen event found"
        )

    ended_at = datetime.now()
    active_event.ended_at = ended_at
   # Tunahesabu event ilidumu kwa sekunde ngapi.
    active_event.duration_sec = (
        ended_at - active_event.started_at
    ).total_seconds()
   # Tunaonyesha kwamba event haipo active tena.
    active_event.is_active = False

    # Tuna-save mabadiliko kwenye database.
    db.commit()
    db.refresh(active_event)

    # Tunamrudishia frontend taarifa kamili ya event.
    return active_event

@router.get(
    "/{interview_id}/attention/events",
    response_model=list[AttentionEventResponse]
)
def get_attention_events(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Endpoint hii inarudisha attention events zote
    zilizorekodiwa kwenye interview husika.
    """

    # Tunatafuta interview kwanza kwa kutumia ID yake.
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

    # Tunahakikisha user anayefanya request ndiye mwenye interview.
    if interview.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to access this interview"
        )

    # Tunachukua events zote za interview hii.
    # Tunazipanga kuanzia event ya zamani kwenda mpya.
    events = (
        db.query(AttentionEvent)
        .filter(
            AttentionEvent.interview_id == interview_id
        )
        .order_by(
            AttentionEvent.started_at.asc()
        )
        .all()
    )

    # Tunamrudishia user events zote.
    return events

