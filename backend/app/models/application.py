
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey, String, DateTime, Integer
# SQLAlchemy ORM tools kwa ajili ya columns na relationships.
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.job import Job
    from app.models.user import User
    from app.models.interview import Interview    

class Application(Base):

    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    job_id: Mapped[int] = mapped_column(
        ForeignKey("jobs.id"),
        nullable=False,
        index=True
    )

    candidate_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="pending",
        nullable=False
    )

    applied_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        nullable=False
    )

    # Relationship kati ya Application na Job.
    job: Mapped["Job"] = relationship(
        "Job",
        back_populates="applications"
    )

    # Relationship kati ya Application na User/Candidate.
    candidate: Mapped["User"] = relationship(
        "User",
        back_populates="applications"
    )

    # Application moja inaweza kuwa na interview moja au zaidi.
    interviews: Mapped[list["Interview"]] = relationship(
        "Interview",
        back_populates="application",
        cascade="all, delete-orphan"
    )