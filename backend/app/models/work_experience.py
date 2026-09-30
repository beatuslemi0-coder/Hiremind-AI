
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey, String, Text, Date, DateTime, Boolean
# SQLAlchemy ORM tools.
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.candidate_profile import CandidateProfile

class WorkExperience(Base):

    __tablename__ = "work_experience"
    
    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    profile_id: Mapped[int] = mapped_column(
        ForeignKey("candidate_profiles.id"),
        nullable=False,
        index=True
    )

    job_title: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    company_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    start_date: Mapped[datetime] = mapped_column(
        Date,
        nullable=False
    )

    end_date: Mapped[datetime | None] = mapped_column(
        Date,
        nullable=True
    )

    currently_working: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        nullable=False
    )

    # Relationship kati ya WorkExperience na CandidateProfile.
    profile: Mapped["CandidateProfile"] = relationship(
        "CandidateProfile",
        back_populates="work_experience"
    )