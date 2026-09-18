# Tunatumia datetime kuweka muda ambao interview imeanza
# na muda ambao interview imekamilika.
from datetime import datetime

# SQLAlchemy Session inatumika kuwasiliana na database.
from sqlalchemy.orm import Session

# Tuna-import Interview model.
from app.models.interview import Interview
from app.models.report import Report
from app.models.answer import Answer

# Tuna-import repository inayohusika na database operations
# za Interview.
from app.repositories.interview_repository import InterviewRepository


class InterviewService:

    # ---------------------------------------------------------
    # Kutengeneza interview mpya kwa user aliye-login.
    # ---------------------------------------------------------
    @staticmethod
    def create_interview(
        db: Session,
        user_id: int,
        title: str
    ) -> Interview:

        # Tunatengeneza interview mpya.
        # Interview mpya inaanza ikiwa na status ya "pending".
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

    # ---------------------------------------------------------
    # Kupata interviews zote za user aliye-login.
    # ---------------------------------------------------------
    @staticmethod
    def get_user_interviews(
        db: Session,
        user_id: int
    ) -> list[Interview]:

        # Tunatafuta interviews ambazo user_id yake
        # inalingana na user aliye-login.
        return InterviewRepository.get_by_user(
            db,
            user_id
        )

    # ---------------------------------------------------------
    # Kupata interview moja na kuhakikisha ni ya user huyu.
    # ---------------------------------------------------------
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

        # Tunahakikisha interview ni ya user aliye-login.
        # Hii inazuia user kuona interview ya mtu mwingine.
        if interview.user_id != user_id:
            raise PermissionError(
                "You do not have permission to access this interview"
            )

        # Kama interview ni ya user huyu, tunairudisha.
        return interview

    # ---------------------------------------------------------
    # Kuanzisha interview.
    # ---------------------------------------------------------
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

        # Application-based interviews are created as "started"; activation
        # is idempotent for an already active interview.
        if interview.status == "in_progress":
            return interview
        if interview.status not in {"pending", "started"}:
            raise ValueError(
                "Interview cannot be started because it is not active"
            )

        # Tunabadilisha status kuwa in_progress.
        interview.status = "in_progress"

        # Tunaweka muda ambao interview imeanza.
        interview.started_at = datetime.now()

        # Tunahifadhi mabadiliko kwenye database.
        db.commit()

        # Tunarefresh object ili kupata data mpya kutoka database.
        db.refresh(interview)

        return interview

    # ---------------------------------------------------------
    # Kumaliza interview.
    # ---------------------------------------------------------
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

        # Allow completion from either active state because the application
        # start endpoint creates the interview as "started".
        if interview.status not in {"started", "in_progress"}:
            raise ValueError(
                "Only an active interview can be completed"
            )

        # Tunabadilisha status kuwa completed.
        interview.status = "completed"

        # Tunaweka muda ambao interview imekamilika.
        interview.finished_at = datetime.utcnow()

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

        # Tunahifadhi mabadiliko kwenye PostgreSQL.
        db.commit()

        # Tunapata data iliyosasishwa kutoka database.
        db.refresh(interview)

        return interview

