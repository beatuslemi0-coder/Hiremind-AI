from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    # Import hii ni kwa type checking tu ili kuepuka circular import.
    from app.models.interview import Interview


class AttentionEvent(Base):
    """
    Model hii inahifadhi matukio maalum ya attention,
    mfano candidate kuwa off-screen kwa muda fulani.
    """

    __tablename__ = "attention_events"

    # ID ya kipekee ya tukio.
    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    # Interview ambayo tukio hili linahusiana nayo.
    interview_id: Mapped[int] = mapped_column(
        ForeignKey("interviews.id"),
        nullable=False,
        index=True
    )

    # Aina ya tukio, kwa mfano "off_screen".
    event_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    # Muda ambao tukio lilianza.
    started_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False
    )

    # Muda ambao tukio liliisha.
    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    # Muda wa tukio kwa seconds.
    duration_sec: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    # Inaonyesha kama tukio bado linaendelea.
    is_active: Mapped[bool] = mapped_column(
        default=True,
        nullable=False
    )

    # Relationship kati ya event na interview.
    interview: Mapped["Interview"] = relationship(
        "Interview",
        back_populates="attention_events"
    )