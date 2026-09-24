from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


if TYPE_CHECKING:
    from app.models.interview import Interview


class AttentionMetric(Base):

    __tablename__ = "attention_metrics"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    interview_id: Mapped[int] = mapped_column(
        ForeignKey("interviews.id"),
        nullable=False,
        index=True
    )

    # Degree ambayo macho/uso ume-deviate kutoka kwenye camera.
    # Mfano: 0° = anaangalia camera moja kwa moja.
    gaze_deviation_deg: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    # Inaonyesha kama uso wa candidate umeonekana kwenye camera.
    face_detected: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )

    # Inaonyesha kama candidate alikuwa anaangalia nje ya screen/camera.
    off_screen: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )

    # Muda ambao metric hii ilirekodiwa.
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        nullable=False
    )

    # Relationship kati ya AttentionMetric na Interview.
    interview: Mapped["Interview"] = relationship(
        "Interview",
        back_populates="attention_metrics"
    )