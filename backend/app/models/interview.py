from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
# Imports hizi hutumika kwa type checking tu.
if TYPE_CHECKING:
    from app.models.question import Question
    from app.models.report import Report
    from app.models.user import User
    from app.models.application import Application
    from app.models.attention_metric import AttentionMetric
    from app.models.attention_session import AttentionSession

# Model hii inawakilisha interview ya candidate.
class Interview(Base):

    # Jina la database table.
    __tablename__ = "interviews"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    # ID ya candidate anayefanya interview.
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )
    #ID ya application inayohusiana na intervie
    application_id: Mapped[int] = mapped_column(
        ForeignKey("applications.id"),
        nullable=False,
        index=True
    )

    # Jina/title ya interview.
    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )

    # Status ya interview.
    status: Mapped[str] = mapped_column(
        String(50),
        default="pending",
        nullable=False
    )

    # Muda ambao interview ilianza.
    started_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        nullable=False
    )

    # Muda ambao interview ilimalizika.
    finished_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    # Muda ambao interview iliundwa.
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        nullable=False
    )

    # Relationship kati ya interview na user.
    user: Mapped["User"] = relationship(
        "User",
        back_populates="interviews"
    )
    #relationship kati ya interview na applicatio
    application: Mapped["Application"] = relationship(
        "Application",
        back_populates="interviews"
    )

    # Interview moja inaweza kuwa na questions nyingi.
    questions: Mapped[list["Question"]] = relationship(
        "Question",
        back_populates="interview",
        cascade="all, delete-orphan"
    )

    # Interview inaweza kuwa na report moja.
    report: Mapped["Report | None"] = relationship(
        "Report",
        back_populates="interview",
        uselist=False,
        cascade="all, delete-orphan"
    )
    
    # Interview moja inaweza kuwa na attention metrics nyingi.
    # Kila metric inawakilisha observation kutoka kwenye camera.
    attention_metrics: Mapped[list["AttentionMetric"]] = relationship(
        "AttentionMetric",
        back_populates="interview",
        cascade="all, delete-orphan"
    )
    
    attention_sessions: Mapped[list["AttentionSession"]] = relationship(
    "AttentionSession",
    back_populates="interview",
    cascade="all, delete-orphan"
)

