
from datetime import datetime

from typing import TYPE_CHECKING


from sqlalchemy import String, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.interview import Interview
    from app.models.document import Document
    from app.models.candidate_profile import CandidateProfile
    from app.models.job import Job
    from app.models.application import Application


class User(Base):
    __tablename__ = "users"


    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    username: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )

    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    role: Mapped[str] = mapped_column(
        String(30),
        default="interviewee",
        nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        nullable=False
    )

    interviews: Mapped[list["Interview"]] = relationship(
        "Interview",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # User mmoja anaweza kuwa na documents nyingi.
    documents: Mapped[list["Document"]] = relationship(
       "Document",
        back_populates="user",
        cascade="all, delete-orphan"

    )
# User mmoja ana candidate profile moja.
# Profile hii itahifadhi taarifa za elimu na uzoefu wa kazi.
    candidate_profile: Mapped["CandidateProfile | None"] = relationship(
       "CandidateProfile",
       back_populates="user",
       uselist=False,
       cascade="all, delete-orphan"
    )

    # User mmoja anaweza kuwa employer na kuwa na jobs nyingi.
    jobs: Mapped[list["Job"]] = relationship(
        "Job",
        back_populates="user"
    )
    #user mmoja akiwa candidate anaweza kutuma application nyingi
    applications: Mapped[list["Application"]] = relationship(
        "Application",
        back_populates="candidate",
        cascade="all, delete-orphan"
    )

