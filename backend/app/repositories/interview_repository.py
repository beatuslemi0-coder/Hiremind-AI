from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.interview import Interview

class InterviewRepository:

    @staticmethod
    def get_by_id(
        db: Session,
        interview_id: int
    ) -> Interview | None:
        return db.get(Interview, interview_id)

    @staticmethod
    def get_by_user(
        db: Session,
        user_id: int
    ) -> list[Interview]:

        statement = select(Interview).where(
            Interview.user_id == user_id
        )

        return list(
            db.scalars(statement).all()
        )

    @staticmethod
    def create(
        db: Session,
        interview: Interview
    ) -> Interview:

        db.add(interview)
        db.commit()
        db.refresh(interview)

        return interview

    @staticmethod
    def delete(
        db: Session,
        interview: Interview
    ) -> None:

        db.delete(interview)
        db.commit()