# Tuna-import datetime kwa ajili ya kuhifadhi muda ambao profile iliundwa.
from datetime import datetime

# TYPE_CHECKING inazuia circular import wakati application inaanza.
from typing import TYPE_CHECKING

# SQLAlchemy types tunazohitaji.
from sqlalchemy import ForeignKey, String, DateTime

# SQLAlchemy ORM tools.
from sqlalchemy.orm import Mapped, mapped_column, relationship

# Base ya models zote za mfumo.
from app.models.base import Base
from app.models.education import Education
from app.models.work_experience import WorkExperience

# Import hii itatumika wakati wa type checking tu.
if TYPE_CHECKING:
    from app.models.user import User
    from app.models.education import Education
    from app.models.work_experience import WorkExperience


# Model hii inahifadhi profile ya candidate.
class CandidateProfile(Base):

    # Jina la table kwenye PostgreSQL.
    __tablename__ = "candidate_profiles"

    # ID ya kipekee ya profile.
    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    # ID ya user anayemiliki profile hii.
    # unique=True inahakikisha user mmoja anakuwa na profile moja tu.
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        unique=True,
        nullable=False,
        index=True
    )

    # Namba ya simu ya candidate.
    phone_number: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True
    )

    # Mahali candidate anapoishi.
    location: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True
    )

    # Muda ambao profile iliundwa.
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        nullable=False
    )

    # Relationship kati ya profile na User.
    user: Mapped["User"] = relationship(
        "User",
        back_populates="candidate_profile"
    )

    # Candidate mmoja anaweza kuwa na records nyingi za elimu.
    education: Mapped[list["Education"]] = relationship(
        "Education",
        back_populates="profile",
        cascade="all, delete-orphan"
    )

    # Candidate mmoja anaweza kuwa na records nyingi za work experience.
    work_experience: Mapped[list["WorkExperience"]] = relationship(
        "WorkExperience",
        back_populates="profile",
        cascade="all, delete-orphan"
    )