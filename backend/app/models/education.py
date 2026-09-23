
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey, String, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.candidate_profile import CandidateProfile


class Education(Base):

    __tablename__ = "education"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    profile_id: Mapped[int] = mapped_column(
        ForeignKey("candidate_profiles.id"),
        nullable=False,
        index=True
    )

    education_level: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    institution: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    field_of_study: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    start_year: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    end_year: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        nullable=False
    )

    # Relationship kati ya Education na CandidateProfile.
    profile: Mapped["CandidateProfile"] = relationship(
        "CandidateProfile",
        back_populates="education"
    )