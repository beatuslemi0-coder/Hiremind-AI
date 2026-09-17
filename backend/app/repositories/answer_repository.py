from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.answer import Answer


class AnswerRepository:

    @staticmethod
    def get_by_id(
        db: Session,
        answer_id: int
    ) -> Answer | None:
        return db.get(Answer, answer_id)

    @staticmethod
    def get_by_question(
        db: Session,
        question_id: int
    ) -> list[Answer]:

        statement = select(Answer).where(
            Answer.question_id == question_id
        )

        return list(
            db.scalars(statement).all()
        )

    @staticmethod
    def create(
        db: Session,
        answer: Answer
    ) -> Answer:

        db.add(answer)
        db.commit()
        db.refresh(answer)

        return answer

    @staticmethod
    def update(
        db: Session,
        answer: Answer
    ) -> Answer:

        db.commit()
        db.refresh(answer)

        return answer