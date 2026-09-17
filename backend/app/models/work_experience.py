# Tuna-import datetime kwa ajili ya kuhifadhi muda wa record kuundwa.
from datetime import datetime

# TYPE_CHECKING inasaidia kuzuia circular imports.
from typing import TYPE_CHECKING

# SQLAlchemy types tunazohitaji.
from sqlalchemy import ForeignKey, String, Text, Date, DateTime, Boolean

# SQLAlchemy ORM tools.
from sqlalchemy.orm import Mapped, mapped_column, relationship

# Base ya models zote za HireMind-AI.
from app.models.base import Base


# Import hii itatumika wakati wa type checking tu.
if TYPE_CHECKING:
    from app.models.candidate_profile import CandidateProfile


# Model ya kuhifadhi uzoefu wa kazi wa candidate.
class WorkExperience(Base):

    # Jina la table kwenye PostgreSQL.
    __tablename__ = "work_experience"

    # ID ya kipekee ya experience.
    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    # Inaonyesha profile ya candidate anayemiliki experience hii.
    profile_id: Mapped[int] = mapped_column(
        ForeignKey("candidate_profiles.id"),
        nullable=False,
        index=True
    )

    # Jina la nafasi ambayo candidate alikuwa nayo.
    job_title: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    # Jina la kampuni/organization alikofanya kazi.
    company_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    # Maelezo ya majukumu aliyokuwa akifanya.
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    # Tarehe ambayo alianza kazi.
    start_date: Mapped[datetime] = mapped_column(
        Date,
        nullable=False
    )

    # Tarehe ambayo aliacha kazi.
    # Inaweza kuwa NULL kama bado anafanya kazi.
    end_date: Mapped[datetime | None] = mapped_column(
        Date,
        nullable=True
    )

    # Inaonyesha kama candidate bado anafanya kazi kwenye kampuni hiyo.
    currently_working: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )

    # Muda ambao record hii iliundwa.
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