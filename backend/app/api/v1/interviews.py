# APIRouter inatusaidia kutengeneza endpoints za interviews.
from fastapi import APIRouter, Depends, HTTPException,UploadFile,File, status
import asyncio
import logging
import re

from sqlalchemy.orm import Session

# Kutengeneza majina ya files bila kugongana.
import uuid
import os
import shutil

# Kushughulikia paths za files.
from pathlib import Path


# Dependency ya kupata database session.
from app.db.session import get_db

# Dependency ya kupata user aliye-login.
from app.api.dependencies import get_current_user

# User model.
from app.models.user import User

from app.models.interview import Interview
from app.services.ai_service import AIService
from app.services.pdf_service import PDFService
from app.models.document import Document

# Library ya Whisper kwa kubadilisha sauti kuwa maandishi.
import whisper
from app.models.question import Question
from app.models.answer import Answer
from app.models.attention_session import AttentionSession



def _ensure_ffmpeg() -> bool:
    try:
        import imageio_ffmpeg

        ffmpeg_executable = imageio_ffmpeg.get_ffmpeg_exe()
        os.environ["PATH"] = f"{Path(ffmpeg_executable).parent}{os.pathsep}{os.environ.get('PATH', '')}"
        return True
    except (ImportError, RuntimeError):
        return shutil.which("ffmpeg") is not None

# Tuna-import service inayobadilisha swali la Kiswahili kuwa sauti.
from app.services.tts_service import TTSService



from app.services.interview_service import InterviewService

# Interview schemas kwa validation ya request na response.
from app.schemas.interview import (
    InterviewCreate,
    InterviewResponse,
    TextAnswerRequest,
)
# Tiny is faster for live interview responses; override with WHISPER_MODEL if needed.
whisper_model = whisper.load_model(os.getenv("WHISPER_MODEL", "tiny"))
# Tuna-import Application ili kuthibitisha application ya candidate.
from app.models.application import Application

# Tuna-import Job ili kuhakikisha application inahusiana na job sahihi.
from app.models.job import Job

logger = logging.getLogger(__name__)



# Tunatengeneza router ya interviews.
router = APIRouter(
    prefix="/interviews",
    tags=["Interviews"]
)


def _ai_service_http_error(exc: Exception) -> HTTPException:
    message = str(exc).lower()

    if "resource_exhausted" in message or "quota" in message or "429" in message:
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI interview service is unavailable because the Gemini API quota has been exhausted. Please try again later or update the Gemini API key."
        )

    if "api key" in message or "authentication" in message or "unauthorized" in message:
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI interview service authentication failed. Please check the backend Gemini API key."
        )

    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=f"AI interview service failed: {exc}"
    )


def _is_gemini_quota_error(exc: Exception) -> bool:
    message = str(exc).lower()
    return "resource_exhausted" in message or "quota" in message or "429" in message


def _normalize_question(text: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s]", "", text.lower())).strip()


def _initial_fallback_question(job: Job) -> str:
    skills = (job.skills_required or "").strip()
    if skills:
        return (
            f"Kwa kuzingatia nafasi ya {job.title} na mahitaji ya ujuzi ya {skills}, "
            "eleza uzoefu wako wa vitendo unaohusiana na kazi hii."
        )
    return (
        f"Kwa kuzingatia nafasi ya {job.title}, eleza uzoefu wako wa vitendo "
        "unaokufanya ufaae kwa kazi hii."
    )


def _fallback_question(
    job: Job,
    question_number: int = 1,
    previous_questions: list[str] | None = None,
    candidate_answer: str = "",
) -> str:
    answer_topic = "uzoefu ulioutaja kwenye jibu lako" if candidate_answer.strip() else "ulichokieleza kwenye jibu lako"
    questions = [
        f"Umetaja {answer_topic}; ni matokeo gani ya kupimika uliyapata katika hilo?",
        f"Ni changamoto gani kubwa ulikutana nayo katika {answer_topic}, na uliitatua kwa hatua zipi?",
        f"Katika {answer_topic}, ulifanya uamuzi gani muhimu na kwa nini uliuchagua?",
        f"Ulishirikiana vipi na timu katika {answer_topic}, na wewe ulikuwa na jukumu gani?",
        f"Ulipimaje mafanikio ya {answer_topic}, na ungeboresha nini leo?",
        f"Ni ujuzi gani wa kiufundi uliohusika katika {answer_topic}, na uliutumiaje kwa vitendo?",
        f"Ukipewa hali kama ya {answer_topic} katika nafasi ya {job.title}, ungeanza na hatua gani?",
        f"Umejifunza nini kutokana na {answer_topic}, na somo hilo linakusaidiaje kazini?",
        f"Eleza namna ulivyowasilisha taarifa kuhusu {answer_topic} kwa mtu ambaye si mtaalamu.",
        f"Ni hatari gani uliyoiona katika {answer_topic}, na uliichukulia hatua gani?",
    ]
    used = {_normalize_question(question) for question in (previous_questions or [])}
    for offset in range(len(questions)):
        candidate = questions[(question_number - 1 + offset) % len(questions)]
        if _normalize_question(candidate) not in used:
            return candidate
    return f"Kwa kuzingatia jibu lako kuhusu {answer_topic}, ni jambo gani jingine muhimu ungependa kuongeza?"


# Endpoint hii inaanzisha interview mpya kwa candidate.
@router.post(
    "/start",
    status_code=status.HTTP_201_CREATED
)
def start_interview(
    application_id: int,
    # Database session.
    db: Session = Depends(get_db),

    # Tunampata user aliye-login kupitia JWT.
    current_user: User = Depends(get_current_user)
):
    #tunatafuta application ambayo candidate ameomba
    application = (
        db.query(Application)
        .filter(
            Application.id == application_id,
            Application.candidate_id == current_user.id
        )
        .first()
    )

    #kama application haipo au si ya candidate huyu
    if application is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"

        )
    # Employers must shortlist or accept an application before the interview.
    if application.status not in {"shortlisted", "accepted"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The employer has not approved this application for an interview yet"
        )
    #Tunatafuta job inayohusiana na application
    job = (
        db.query(Job)
        .filter(Job.id == application.job_id)
        .first()
    )

    #kama job haipo
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    #Tunahakikisha job bado iko active
    if job.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This job is no longer active"
        )

    # Tunatafuta CV ya candidate.
    cv = (
        db.query(Document)
        .filter(
            Document.user_id == current_user.id,
            Document.document_type == "cv"
        )
        .first()
    )

    # Kama candidate hajapakia CV.
    if cv is None:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload your CV before starting the interview"
        )

    # Tunatoa text kutoka kwenye CV.
    cv_text = PDFService.extract_text(
        cv.file_path
    )

    # Kama CV haina text.
    if not cv_text.strip():

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract readable text from CV"
        )

    # Tunatengeneza taarifa za Job kwa ajili ya Gemini.
    job_information = f"""
    JOB TITLE:
   {job.title}

   JOB DESCRIPTION:
   {job.description}

   LOCATION:
   {job.location}

   EMPLOYMENT TYPE:
   {job.employment_type}

   EDUCATION REQUIRED:
   {job.education_required or "Not specified"}

   EXPERIENCE REQUIRED:
   {job.experience_required if job.experience_required is not None else "Not specified"}

   SKILLS REQUIRED:
   {job.skills_required or "Not specified"}
   """
    

   # Tunapeleka CV pamoja na taarifa za Job kwa Gemini.
   # Hii inafanya swali la kwanza liwe specific kwa nafasi iliyotangazwa.
    try:
        first_question = AIService.generate_interview_question(
            candidate_information=cv_text,
            job_information=job_information
        )
    except Exception as exc:
        if _is_gemini_quota_error(exc):
            first_question = _initial_fallback_question(job)
        else:
            raise _ai_service_http_error(exc) from exc

    # Create the interview only after the first AI question succeeds.
    interview = Interview(
        user_id=current_user.id,
        application_id=application_id,
        title=f"Interview - {job.title}",
        status="started"
    )
    db.add(interview)
    db.commit()
    db.refresh(interview) 
    
    #START ATTENTION MONITORING
    
    attention_session =  AttentionSession(
        interview_id=interview.id,
        is_active=True
    )
    
    db.add(attention_session)
    db.commit()
    db.refresh(attention_session)
    

    # Tunahifadhi swali la kwanza kwenye database.
    first_question_record = Question(
        interview_id=interview.id,
        question_text=first_question,
        question_type="technical",
        order_number=1
    )

    db.add(first_question_record)
    db.commit()
    db.refresh(first_question_record)

    # Tunatengeneza sauti ya swali la kwanza kwa kutumia Gemini TTS.
    tts_folder = Path("uploads/tts")
    tts_folder.mkdir(parents=True, exist_ok=True)
    tts_filename = f"{uuid.uuid4()}.wav"
    tts_file_path = tts_folder / tts_filename

    try:
        TTSService.generate_swahili_speech(
            text=first_question,
            output_path=str(tts_file_path)
        )
    except Exception as exc:
        # Text interview can continue when the optional voice service is unavailable.
        tts_filename = None

    # Tunamrudishia candidate interview, swali la kwanza, na audio yake.
    return {
        "interview_id": interview.id,
        "application_id": application_id,
        "job_id": job.id,
        "job_title":job.title,
        "status": interview.status,
        "question_id": first_question_record.id,
        "question": first_question,
        "attention_monitoring": attention_session.is_active,
        "attention-session_id": attention_session.id,
        "audio_url": f"/uploads/tts/{tts_filename}" if tts_filename else None
    }

# Get My Interviews
@router.get(
    "/",
    response_model=list[InterviewResponse],
    summary="Get all my interviews"
)
def get_my_interviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Tunapata interviews zote ambazo ni za user huyu.
    return InterviewService.get_user_interviews(
        db=db,
        user_id=current_user.id
    )

# Get One Interview
@router.get(
    "/{interview_id}",
    response_model=InterviewResponse
)
def get_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Tunajaribu kupata interview ya user huyu.
    try:
        return InterviewService.get_user_interview(
            db=db,
            interview_id=interview_id,
            user_id=current_user.id
        )

    # Kama interview si yake, tunarudisha 403.
    except PermissionError as error:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(error)
        )

    # Kama interview haipo, tunarudisha 404.
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error)
        )


# Start Interview
@router.post(
    "/{interview_id}/start",
    response_model=InterviewResponse
)
def start_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Tunajaribu kuanzisha interview.
    try:
        return InterviewService.start_interview(
            db=db,
            interview_id=interview_id,
            user_id=current_user.id
        )

    # Kama interview si yake, tunarudisha 403.
    except PermissionError as error:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(error)
        )

    # Kama status hairuhusu kuanza, tunarudisha 400.
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


# ---------------------------------------------------------
# Complete Interview
# ---------------------------------------------------------
@router.post(
    "/{interview_id}/complete",
    response_model=InterviewResponse
)
def complete_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Tunajaribu kumaliza interview.
    try:
        return InterviewService.complete_interview(
            db=db,
            interview_id=interview_id,
            user_id=current_user.id
        )

    # Kama interview si ya user huyu, tunarudisha 403.
    except PermissionError as error:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(error)
        )

    # Kama interview haiwezi kumalizwa kutokana na status,
    # tunarudisha 400.
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


@router.post(
    "/{interview_id}/voice-answer",
    status_code=status.HTTP_201_CREATED
)
async def upload_voice_answer(

    interview_id: int,
    audio: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    interview = (
        db.query(Interview)
        .filter(
            Interview.id == interview_id,
            Interview.user_id == current_user.id
        )
        .first()
    )
    
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )

    application = interview.application
    if not application:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Interview is not linked to an application"
        )

    # Tunachukua Job kupitia Application hiyo hiyo.
    job = application.job

    # Tunahakikisha Application ina Job.
    if not job:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application is not linked to a job"
        )

    # Kama interview haipo.
    if interview is None:

        raise HTTPException(
            status_code=404,
            detail="Interview not found"
        )

    cv = (
        db.query(Document)
        .filter(
            Document.user_id == current_user.id,
            Document.document_type == "cv"
        )
        .first()
    )

    if cv is None:

        raise HTTPException(
            status_code=400,
            detail="Candidate CV not found"
        )

    current_question = (
        db.query(Question)
        .filter(
            Question.interview_id == interview_id
        )
        .order_by(
            Question.order_number.desc()
        )
        .first()
    )

    # Kama hakuna swali.
    if current_question is None:

        raise HTTPException(
            status_code=400,
            detail="No interview question found"
        )

    # Folder ambayo audio za interview zitawekwa.
    audio_folder = Path("uploads/audio")

    # Tunatengeneza folder kama haipo.
    audio_folder.mkdir(
        parents=True,
        exist_ok=True
    )

    # Tunatengeneza filename ya kipekee.
    filename = f"{uuid.uuid4()}_{audio.filename}"

    # Full path ya audio.
    file_path = audio_folder / filename

    # Tunasoma audio kutoka kwenye request.
    audio_data = await audio.read()

    # Tunahifadhi audio.
    with open(file_path, "wb") as file:

        file.write(audio_data)

    # 5. WHISPER: AUDIO → TEXT

    if not _ensure_ffmpeg():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Audio transcription is unavailable because FFmpeg is not installed in the Python environment running the backend. Install imageio-ffmpeg with that environment and restart Uvicorn."
        )

    # Whisper inasoma sauti na kuitengeneza kuwa text.
    # Hapa tunaacha Whisper itambue lugha yenyewe.
    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(whisper_model.transcribe, str(file_path)),
            timeout=90,
        )
    except asyncio.TimeoutError as exc:
        logger.error("Whisper timed out for interview %s", interview_id)
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Audio transcription timed out. Please record a shorter answer and try again.",
        ) from exc
    except Exception as exc:
        logger.exception("Whisper failed for interview %s", interview_id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Audio transcription failed: {exc}",
        ) from exc

    # Tunachukua transcription.
    candidate_answer = result["text"].strip()


    # Kama hakuna text iliyopatikana.
    if not candidate_answer:

        raise HTTPException(
            status_code=400,
            detail="Could not understand the candidate's voice"
        )

    db.add(Answer(
        question_id=current_question.id,
        answer_text=candidate_answer,
        score=min(100.0, max(0.0, len(candidate_answer.split()) * 2.5)),
        ai_feedback="Jibu limepokelewa na kuhifadhiwa kwa ajili ya tathmini ya interview.",
    ))
    db.commit()

    if current_question.order_number >= 10:
        InterviewService.complete_interview(
            db=db,
            interview_id=interview.id,
            user_id=current_user.id,
        )
        return {
            "message": "Interview completed successfully",
            "interview_id": interview.id,
            "question_id": current_question.id,
            "transcription": candidate_answer,
            "next_question_id": None,
            "next_question": None,
            "interview_completed": True,
            "closing_message": "Asante kwa ushirikiano wako. Karibu uangalie report yako.",
            "audio_url": None,
        }


    # Tunatoa text kutoka kwenye CV.
    cv_text = PDFService.extract_text(
        cv.file_path
    )

    # Kama CV haina text.
    if not cv_text.strip():

        raise HTTPException(
            status_code=400,
            detail="Could not extract readable text from CV"
        )

    # Tunachukua Job inayohusiana na interview kupitia Application.
    job = interview.application.job if interview.application else None

    # Tunahakikisha interview ina Job inayohusiana nayo.
    if not job:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Interview is not linked to a job"
        )

    # Tunatengeneza taarifa za Job kwa ajili ya Gemini.
    job_information = f"""
    JOB TITLE:
    {job.title}

    JOB DESCRIPTION:
    {job.description}

    LOCATION:
    {job.location}

    EMPLOYMENT TYPE:
    {job.employment_type}

    EDUCATION REQUIRED:
    {job.education_required or "Not specified"}

    EXPERIENCE REQUIRED:
    {job.experience_required if job.experience_required is not None else "Not specified"}

    SKILLS REQUIRED:
    {job.skills_required or "Not specified"}
    """

    previous_questions = [
        question.question_text
        for question in db.query(Question)
        .filter(Question.interview_id == interview_id)
        .order_by(Question.order_number.asc())
        .all()
    ]

   # Tunapeleka CV, Job, swali la sasa na jibu la candidate kwa Gemini.
   # AI itatumia taarifa hizi kutengeneza follow-up question.
    try:
        next_question = await asyncio.wait_for(
            asyncio.to_thread(
                AIService.analyze_answer_and_generate_next_question,
                candidate_information=cv_text,
                job_information=job_information,
                current_question=current_question.question_text,
                candidate_answer=candidate_answer,
                previous_questions=previous_questions,
            ),
            timeout=120,
        )
    except asyncio.TimeoutError:
        logger.warning("Gemini timed out for interview %s; using fallback question", interview_id)
        next_question = _fallback_question(
            job,
            question_number=current_question.order_number + 1,
            previous_questions=previous_questions,
            candidate_answer=candidate_answer,
        )
    except Exception as exc:
        logger.exception("Gemini failed for interview %s; using fallback question", interview_id)
        next_question = _fallback_question(
            job,
            question_number=current_question.order_number + 1,
            previous_questions=previous_questions,
            candidate_answer=candidate_answer,
        )

    if _normalize_question(next_question) in {
        _normalize_question(question) for question in previous_questions
    }:
        next_question = _fallback_question(
            job,
            question_number=current_question.order_number + 1,
            previous_questions=previous_questions,
            candidate_answer=candidate_answer,
        )

    # Tunapata order number ya swali jipya.
    next_order_number = current_question.order_number + 1

    # Tunatengeneza question mpya.
    new_question = Question(
        interview_id=interview.id,
        question_text=next_question,
        question_type="follow_up",
        order_number=next_order_number
    )

    db.add(new_question)
    db.commit()
    db.refresh(new_question)

    return {
    "message": "Voice answer processed successfully",
    "interview_id": interview.id,
    "question_id": current_question.id,
    "transcription": candidate_answer,
    "next_question_id": new_question.id,
    "next_question": next_question,
    "audio_url": None
}


def _process_candidate_answer(
    db: Session,
    interview: Interview,
    current_question: Question,
    candidate_answer: str,
    current_user: User,
):
    db.add(Answer(
        question_id=current_question.id,
        answer_text=candidate_answer,
        score=min(100.0, max(0.0, len(candidate_answer.split()) * 2.5)),
        ai_feedback="Jibu limepokelewa na kuhifadhiwa kwa ajili ya tathmini ya interview.",
    ))
    db.commit()

    if current_question.order_number >= 10:
        InterviewService.complete_interview(
            db=db,
            interview_id=interview.id,
            user_id=current_user.id,
        )
        return {
            "message": "Interview completed successfully",
            "interview_id": interview.id,
            "question_id": current_question.id,
            "transcription": candidate_answer,
            "next_question_id": None,
            "next_question": None,
            "interview_completed": True,
            "closing_message": "Asante kwa ushirikiano wako. Karibu uangalie report yako.",
            "audio_url": None,
        }

    cv = (
        db.query(Document)
        .filter(
            Document.user_id == current_user.id,
            Document.document_type == "cv"
        )
        .first()
    )
    if cv is None:
        raise HTTPException(status_code=400, detail="Candidate CV not found")

    cv_text = PDFService.extract_text(cv.file_path)
    if not cv_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract readable text from CV")

    job = interview.application.job if interview.application else None
    if not job:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Interview is not linked to a job"
        )

    job_information = f"""
    JOB TITLE:
    {job.title}

    JOB DESCRIPTION:
    {job.description}

    LOCATION:
    {job.location}

    EMPLOYMENT TYPE:
    {job.employment_type}

    EDUCATION REQUIRED:
    {job.education_required or "Not specified"}

    EXPERIENCE REQUIRED:
    {job.experience_required if job.experience_required is not None else "Not specified"}

    SKILLS REQUIRED:
    {job.skills_required or "Not specified"}
    """

    previous_questions = [
        question.question_text
        for question in db.query(Question)
        .filter(Question.interview_id == interview.id)
        .order_by(Question.order_number.asc())
        .all()
    ]

    try:
        next_question = AIService.analyze_answer_and_generate_next_question(
            candidate_information=cv_text,
            job_information=job_information,
            current_question=current_question.question_text,
            candidate_answer=candidate_answer,
            previous_questions=previous_questions,
        )
    except Exception:
        next_question = _fallback_question(
            job,
            question_number=current_question.order_number + 1,
            previous_questions=previous_questions,
            candidate_answer=candidate_answer,
        )

    if _normalize_question(next_question) in {
        _normalize_question(question) for question in previous_questions
    }:
        next_question = _fallback_question(
            job,
            question_number=current_question.order_number + 1,
            previous_questions=previous_questions,
            candidate_answer=candidate_answer,
        )

    new_question = Question(
        interview_id=interview.id,
        question_text=next_question,
        question_type="follow_up",
        order_number=current_question.order_number + 1
    )
    db.add(new_question)
    db.commit()
    db.refresh(new_question)

    return {
        "message": "Answer processed successfully",
        "interview_id": interview.id,
        "question_id": current_question.id,
        "transcription": candidate_answer,
        "next_question_id": new_question.id,
        "next_question": next_question,
        "interview_completed": False,
        "audio_url": None,
    }


@router.post(
    "/{interview_id}/text-answer",
    status_code=status.HTTP_201_CREATED
)
def submit_text_answer(
    interview_id: int,
    payload: TextAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    answer_text = (payload.answer_text or "").strip()
    if not answer_text:
        raise HTTPException(status_code=400, detail="Answer text is required")

    interview = (
        db.query(Interview)
        .filter(
            Interview.id == interview_id,
            Interview.user_id == current_user.id
        )
        .first()
    )
    if interview is None:
        raise HTTPException(status_code=404, detail="Interview not found")

    current_question = (
        db.query(Question)
        .filter(Question.interview_id == interview_id)
        .order_by(Question.order_number.desc())
        .first()
    )
    if current_question is None:
        raise HTTPException(status_code=400, detail="No interview question found")

    return _process_candidate_answer(
        db=db,
        interview=interview,
        current_question=current_question,
        candidate_answer=answer_text,
        current_user=current_user,
    )
 