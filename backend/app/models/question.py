from datetime import datetime

from typing import TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.answer import Answer



if TYPE_CHECKING:
    from app.models.answer import Answer
    from app.models.interview import Interview


class Question(Base):
    __tablename__ = "questions"


    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    interview_id: Mapped[int] = mapped_column(
        ForeignKey("interviews.id"),
        nullable=False,
        index=True
    )

    question_text: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    question_type: Mapped[str] = mapped_column(
        String(50),
        default="technical",
        nullable=False
    )

    order_number: Mapped[int] = mapped_column(
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        nullable=False
    )

    # Relationship hii inaunganisha Question na Interview.
    # Interview ina questions nyingi, wakati Question moja ni ya Interview moja.
    interview: Mapped["Interview"] = relationship(
        "Interview",
        back_populates="questions"
    )

    # Question moja inaweza kuwa na answers nyingi.
    answers: Mapped[list["Answer"]] = relationship(
        "Answer",
        back_populates="question",
        cascade="all, delete-orphan"
    )
        



