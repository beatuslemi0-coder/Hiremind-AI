from email.message import EmailMessage
import smtplib

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.interview import Interview
from app.models.user import User
from app.models.application import Application
from app.models.job import Job
from app.repositories.report_repository import ReportRepository
from app.schemas.report import (
	CandidateMessageRequest,
	CandidateMessageResponse,
	EmployerInterviewReportResponse,
	InterviewAnswerResponse,
	ReportResponse,
)
from app.core.config import settings

router = APIRouter(prefix="/reports", tags=["Reports"])


def _employer_report(
	db: Session,
	interview: Interview,
) -> EmployerInterviewReportResponse | None:
	report = ReportRepository.get_by_interview(db, interview.id)
	if report is None or interview.application is None or interview.application.job is None:
		return None

	return EmployerInterviewReportResponse(
		id=report.id,
		interview_id=report.interview_id,
		overall_score=report.overall_score,
		strengths=report.strengths,
		weaknesses=report.weaknesses,
		recommendation=report.recommendation,
		generated_at=report.generated_at,
		candidate_id=interview.user.id,
		candidate_name=interview.user.username,
		candidate_email=interview.user.email,
		job_title=interview.application.job.title,
		answers=[
			InterviewAnswerResponse(
				question_id=question.id,
				question=question.question_text,
				answer=answer.answer_text,
				score=answer.score,
				feedback=answer.ai_feedback,
			)
			for question in sorted(interview.questions, key=lambda item: item.order_number)
			for answer in question.answers
		],
	)


def _require_employer_report_access(
	db: Session,
	interview_id: int,
	current_user: User,
) -> Interview:
	if current_user.role != "employer":
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only employers can access candidate reports")
	interview = db.query(Interview).filter(Interview.id == interview_id).first()
	if interview is None or interview.application is None or interview.application.job is None:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")
	if interview.application.job.employer_id != current_user.id:
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this interview")
	return interview


@router.get("/interview/{interview_id}", response_model=ReportResponse)
def get_interview_report(
	interview_id: int,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
):
	interview = db.query(Interview).filter(
		Interview.id == interview_id,
		Interview.user_id == current_user.id,
	).first()
	if interview is None:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")

	report = ReportRepository.get_by_interview(db, interview_id)
	if report is None:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report is not ready")
	return report


@router.get("/employer", response_model=list[EmployerInterviewReportResponse])
def get_employer_reports(
	job_id: int | None = None,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
):
	if current_user.role != "employer":
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only employers can access candidate reports")
	query = db.query(Interview).join(Application, Interview.application_id == Application.id).join(
		Job, Application.job_id == Job.id
	).filter(Job.employer_id == current_user.id)
	if job_id is not None:
		query = query.filter(Job.id == job_id)
	interviews = query.all()
	return [report for interview in interviews if (report := _employer_report(db, interview)) is not None]


@router.post("/interview/{interview_id}/message", response_model=CandidateMessageResponse)
def send_candidate_message(
	interview_id: int,
	payload: CandidateMessageRequest,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
):
	interview = _require_employer_report_access(db, interview_id, current_user)
	report = _employer_report(db, interview)
	if report is None:
		raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Report is not ready")
	if not settings.SMTP_HOST or not settings.SMTP_FROM_EMAIL:
		raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Email service is not configured")

	email = EmailMessage()
	email["From"] = settings.SMTP_FROM_EMAIL
	email["To"] = report.candidate_email
	email["Subject"] = payload.subject
	email.set_content(payload.message)

	try:
		if settings.SMTP_USE_TLS:
			with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as smtp:
				smtp.starttls()
				if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
					smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
				smtp.send_message(email)
		else:
			with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as smtp:
				if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
					smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
				smtp.send_message(email)
	except (OSError, smtplib.SMTPException) as exc:
		raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Unable to send email") from exc

	return CandidateMessageResponse(message="Message sent successfully", recipient=report.candidate_email)
