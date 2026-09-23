
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey, String, DateTime
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

class CandidateProfile(Base):

    __tablename__ = "candidate_profiles"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        unique=True,
        nullable=False,
        index=True
    )

    phone_number: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True
    )

    location: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        nullable=False
    )

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