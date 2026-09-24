from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.interview import Interview

class AttentionSession(Base):
    """
    Model hii inahifadhi muda ambao
    attention/camera monitoring ilikuwa inaendelea
    kwenye interview.
    """

    __tablename__ = "attention_sessions"

    # ID ya kipekee ya attention session.
    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    # Interview ambayo session hii inahusiana nayo.
    interview_id: Mapped[int] = mapped_column(
        ForeignKey("interviews.id"),
        nullable=False,
        index=True
    )

    # Muda ambao attention monitoring ilianza.
    started_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        nullable=False
    )

    # Muda ambao attention monitoring iliisha.
    # Mwanzoni huwa NULL mpaka user/model aisitishe.
    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    # Inaonyesha kama monitoring bado inaendelea.
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    # Relationship kati ya attention session na interview.
    interview: Mapped["Interview"] = relationship(
        "Interview",
        back_populates="attention_sessions"
    )