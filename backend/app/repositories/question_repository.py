from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.question import Question


class QuestionRepository:

    @staticmethod
    def get_by_id(
        db: Session,
        question_id: int
    ) -> Question | None:
        return db.get(Question, question_id)

    @staticmethod
    def get_by_interview(
        db: Session,
        interview_id: int
    ) -> list[Question]:

        statement = (
            select(Question)
            .where(
                Question.interview_id == interview_id
            )
            .order_by(
                Question.order_number
            )
        )

        return list(
            db.scalars(statement).all()
        )

    @staticmethod
    def create(
        db: Session,
        question: Question
    ) -> Question:

        db.add(question)
        db.commit()
        db.refresh(question)

        return question