from datetime import datetime
from sqlalchemy import Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    interview_id: Mapped[int] = mapped_column(
        ForeignKey("interviews.id"),
        nullable=False,
        unique=True,
        index=True
    )

    overall_score: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    strengths: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    weaknesses: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    recommendation: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    generated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    interview = relationship(
        "Interview",
        back_populates="report"
    )