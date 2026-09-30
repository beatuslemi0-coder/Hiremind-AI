
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
if TYPE_CHECKING:
    from app.models.question import Question

class Answer(Base):

    __tablename__ = "answers"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    question_id: Mapped[int] = mapped_column(
        ForeignKey("questions.id"),
        nullable=False,
        index=True
    )

    answer_text: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    ai_feedback: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    answered_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        nullable=False
    )

    question: Mapped["Question"] = relationship(
        "Question",
        back_populates="answers"
    )
