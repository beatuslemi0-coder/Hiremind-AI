


# Tunatumia datetime kuhifadhi muda ambao answer ilitolewa.
from datetime import datetime

# TYPE_CHECKING inatumika kwa type hints tu,
# bila kusababisha circular import wakati application inaanza.
from typing import TYPE_CHECKING

# SQLAlchemy columns tunazotumia kwenye Answer model.
from sqlalchemy import Text, DateTime, ForeignKey, Float

# SQLAlchemy tools za kutengeneza columns na relationships.
from sqlalchemy.orm import Mapped, mapped_column, relationship

# Base ndiyo parent class ya models zetu zote.
from app.models.base import Base


# Import hii inatumika wakati wa type checking tu.
if TYPE_CHECKING:
    from app.models.question import Question


# Hii model inawakilisha answers table kwenye PostgreSQL.
class Answer(Base):

    # Jina la table kwenye database.
    __tablename__ = "answers"

    # ID ya answer.
    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    # ID ya question ambayo answer hii inahusiana nayo.
    question_id: Mapped[int] = mapped_column(
        ForeignKey("questions.id"),
        nullable=False,
        index=True
    )

    # Jibu la candidate.
    answer_text: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    # Score ambayo AI itampa candidate.
    # Inaweza kuwa None kabla AI haijafanya evaluation.
    score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    # Feedback ambayo AI itatoa baada ya evaluation.
    ai_feedback: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    # Muda ambao candidate alijibu.
    answered_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        nullable=False
    )

    # Answer moja inahusiana na Question moja.
    question: Mapped["Question"] = relationship(
        "Question",
        back_populates="answers"
    )
