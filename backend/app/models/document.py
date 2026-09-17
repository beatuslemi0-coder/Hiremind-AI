# Tunatumia Enum kutengeneza aina zinazokubalika za documents.
from enum import Enum

# Tunatumia datetime kuhifadhi muda wa upload.
from datetime import datetime

# TYPE_CHECKING inatumika kwa type hints bila kusababisha circular import.
from typing import TYPE_CHECKING

# SQLAlchemy columns na ForeignKey.
from sqlalchemy import String, DateTime, ForeignKey, Enum as SQLEnum

# SQLAlchemy ORM tools.
from sqlalchemy.orm import Mapped, mapped_column, relationship

# Base class ya models zetu.
from app.models.base import Base


# Import User kwa ajili ya type checking tu.
if TYPE_CHECKING:
    from app.models.user import User


# Aina za documents ambazo HIREMIND-AI itakubali.
class DocumentType(str, Enum):

    # CV ya candidate.
    CV = "cv"

    # Certificate ya Form Four.
    FORM_FOUR = "form_four"

    # Certificate ya Form Six.
    FORM_SIX = "form_six"

    # Certificate ya Diploma.
    DIPLOMA = "diploma"

    # Certificate ya Degree.
    DEGREE = "degree"


# Model hii inawakilisha documents za candidate.
class Document(Base):

    # Jina la table kwenye PostgreSQL.
    __tablename__ = "documents"

    # ID ya document.
    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    # ID ya user anayemiliki document.
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    # Aina ya document.
    document_type: Mapped[DocumentType] = mapped_column(
        SQLEnum(DocumentType),
        nullable=False
    )

    # Jina la file lililouploadiwa.
    file_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    # Path ambayo file imehifadhiwa.
    file_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False
    )

    # Muda ambao document ili-uploadiwa.
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now(),
        nullable=False
    )

    # Relationship kati ya Document na User.
    user: Mapped["User"] = relationship(
        "User",
        back_populates="documents"
    )