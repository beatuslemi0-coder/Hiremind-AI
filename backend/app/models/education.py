# Tuna-import datetime kwa ajili ya kuhifadhi muda wa record kuundwa.
from datetime import datetime

# TYPE_CHECKING inasaidia kuzuia circular import.
from typing import TYPE_CHECKING

# SQLAlchemy types tunazohitaji.
from sqlalchemy import ForeignKey, String, Integer, DateTime

# SQLAlchemy ORM tools.
from sqlalchemy.orm import Mapped, mapped_column, relationship

# Base ya models zote za HireMind-AI.
from app.models.base import Base


# Import hii itatumika wakati wa type checking tu.
if TYPE_CHECKING:
    from app.models.candidate_profile import CandidateProfile


# Model ya kuhifadhi taarifa za elimu za candidate.
class Education(Base):

    # Jina la table kwenye PostgreSQL.
    __tablename__ = "education"

    # ID ya kipekee ya elimu.
    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    # Inaonyesha profile ya candidate anayemiliki elimu hii.
    profile_id: Mapped[int] = mapped_column(
        ForeignKey("candidate_profiles.id"),
        nullable=False,
        index=True
    )

    # Kiwango cha elimu, mfano Bachelor, Diploma au Certificate.
    education_level: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    # Jina la chuo/shule/taasisi.
    institution: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    # Eneo alilosomea, mfano Computer Engineering.
    field_of_study: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    # Mwaka ambao masomo yalianza.
    start_year: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    # Mwaka ambao masomo yaliisha.
    # Nullable kwa sababu candidate anaweza bado kuwa anaendelea kusoma.
    end_year: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    # Muda ambao record hii iliundwa.
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