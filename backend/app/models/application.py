# Tuna-import datetime kwa ajili ya kuhifadhi muda ambao application iliwasilishwa.
from datetime import datetime

# TYPE_CHECKING inasaidia type hints bila kusababisha circular imports.
from typing import TYPE_CHECKING

# SQLAlchemy types tunazohitaji kwenye Application table.
from sqlalchemy import ForeignKey, String, DateTime, Integer

# SQLAlchemy ORM tools kwa ajili ya columns na relationships.
from sqlalchemy.orm import Mapped, mapped_column, relationship

# Base class ya models zote za HIREMIND-AI.
from app.models.base import Base


# Imports hizi zitatumika wakati wa type checking tu.
# Hii inazuia circular import wakati application inaanzishwa.
if TYPE_CHECKING:
    from app.models.job import Job
    from app.models.user import User
    # Interview model zinazohusishwa na application.
    from app.models.interview import Interview    


# Model hii inawakilisha application ambayo candidate ame-submit kwenye job.
class Application(Base):

    # Jina la table litakalotengenezwa kwenye PostgreSQL.
    __tablename__ = "applications"

    # ID ya kipekee ya kila application.
    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    # ID ya job ambayo candidate ameomba.
    job_id: Mapped[int] = mapped_column(
        ForeignKey("jobs.id"),
        nullable=False,
        index=True
    )

    # ID ya candidate kutoka kwenye users table.
    candidate_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    # Status ya application.
    # Kwa default application inaanza ikiwa pending.
    status: Mapped[str] = mapped_column(
        String(30),
        default="pending",
        nullable=False
    )

    # Muda ambao candidate ali-submit application.
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