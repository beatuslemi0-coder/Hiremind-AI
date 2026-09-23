
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.interview import Interview
from app.models.report import Report
from app.models.answer import Answer
from app.repositories.interview_repository import InterviewRepository

class InterviewService:
    @staticmethod
    def create_interview(
        db: Session,
        user_id: int,
        title: str
    ) -> Interview:

        interview = Interview(
            user_id=user_id,
            title=title,
            status="pending"
        )

        # Tunahifadhi interview kwenye PostgreSQL.
        return InterviewRepository.create(
            db,
            interview
        )

    @staticmethod
    def get_user_interviews(
        db: Session,
        user_id: int
    ) -> list[Interview]:

        return InterviewRepository.get_by_user(
            db,
            user_id
        )

    @staticmethod
    def get_user_interview(
        db: Session,
        interview_id: int,
        user_id: int
    ) -> Interview:

        # Tunatafuta interview kwa kutumia ID.
        interview = InterviewRepository.get_by_id(
            db,
            interview_id
        )

        # Kama interview haipo, tunatoa error.
        if interview is None:
            raise ValueError(
                "Interview not found"
            )

        if interview.user_id != user_id:
            raise PermissionError(
                "You do not have permission to access this interview"
            )

        # Kama interview ni ya user huyu, tunairudisha.
        return interview

    @staticmethod
    def start_interview(
        db: Session,
        interview_id: int,
        user_id: int
    ) -> Interview:

        # Kwanza tunapata interview na kuthibitisha ownership.
        interview = InterviewService.get_user_interview(
            db,
            interview_id,
            user_id
        )

        if interview.status == "in_progress":
            return interview
        if interview.status not in {"pending", "started"}:
            raise ValueError(
                "Interview cannot be started because it is not active"
            )

        interview.status = "in_progress"
        interview.started_at = datetime.now()
        db.commit()
        db.refresh(interview)

        return interview

    @staticmethod
    def complete_interview(
        db: Session,
        interview_id: int,
        user_id: int
    ) -> Interview:

        # Tunapata interview na kuthibitisha ownership.
        interview = InterviewService.get_user_interview(
            db,
            interview_id,
            user_id
        )

        if interview.status not in {"started", "in_progress"}:
            raise ValueError(
                "Only an active interview can be completed"
            )

        interview.status = "completed"
        interview.finished_at = datetime.now()

        answers = [
            answer
            for question in interview.questions
            for answer in question.answers
        ]
        average_score = sum(answer.score or 0 for answer in answers) / len(answers) if answers else 0
        report = interview.report
        if report is None:
            report = Report(
                interview_id=interview.id,
                overall_score=round(average_score, 1),
                strengths="; ".join(
                    answer.ai_feedback for answer in answers if answer.ai_feedback
                ) or "Interview completed successfully.",
                weaknesses="Add more specific examples and measurable outcomes where possible."
                if answers else "No recorded answers were available for evaluation.",
                recommendation=(
                    "Proceed to the next hiring stage."
                    if average_score >= 70 else
                    "Review the answers before making a hiring decision."
                ),
            )
            db.add(report)
        else:
            report.overall_score = round(average_score, 1)

        db.commit()
        db.refresh(interview)
        return interview

