# Tuna-import datetime kwa ajili ya kuhifadhi tarehe ya job.
from datetime import datetime

# TYPE_CHECKING inazuia circular import wakati application inaanza.
from typing import TYPE_CHECKING

# Tuna-import SQLAlchemy types na ForeignKey.
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey

# Tuna-import vifaa vya kutengeneza SQLAlchemy model.
from sqlalchemy.orm import Mapped, mapped_column, relationship

# Base ndiyo parent class ya models zetu zote.
from app.models.base import Base

# Imports hizi zinatumika wakati wa type checking tu.
if TYPE_CHECKING:
    # Employer/User model.
    from app.models.user import User
    from app.models.application import Application


# Tunatengeneza Job model.
class Job(Base):

    # Jina la table litakalotengenezwa PostgreSQL.
    __tablename__ = "jobs"

    # ID ya kipekee ya kila job.
    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    # ID ya user ambaye ame-post job.
    employer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    # Jina la nafasi ya kazi.
    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )

    # Maelezo ya kazi.
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    # Eneo ambalo kazi ipo.
    location: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    # Aina ya ajira, mfano Full-time, Part-time au Internship.
    employment_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    # Kiwango cha elimu kinachohitajika.
    education_required: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True
    )

    # Miaka ya experience inayohitajika.
    experience_required: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    # Skills zinazohitajika kwa job.
    skills_required: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    # Status ya job, mfano active au closed.
    status: Mapped[str] = mapped_column(
        String(30),
        default="active",
        nullable=False
    )

    # Tarehe ambayo job iliwekwa.
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        nullable=False
    )

    # Tarehe ambayo job ilifanyiwa update mwisho.
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        onupdate=datetime.now,
        nullable=False
    )

    # Relationship kati ya Job na User.
    user: Mapped["User"] = relationship(
        "User",
        back_populates="jobs"
    )
    #relationship kati ya job na application
    #job moja inaweza kuwa na application nyingi kutoka kwa user
    applications: Mapped[list["Application"]] = relationship(
        "Application",
        back_populates="job",
        cascade="all, delete-orphan"
    )