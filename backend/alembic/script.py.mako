"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}

"""

# Tuna-import Alembic operations.
from alembic import op

# Tuna-import SQLAlchemy kwa ajili ya sa.Column, sa.Integer, sa.String n.k.
import sqlalchemy as sa

# Tuna-import PostgreSQL types ikiwa migration itahitaji.
from sqlalchemy.dialects import postgresql

# Tuna-import typing utilities.
from typing import Sequence, Union


# Revision ID ya migration hii.
revision: str = ${repr(up_revision)}

# Revision iliyotangulia.
down_revision: Union[str, None] = ${repr(down_revision)}

# Branch labels.
branch_labels: Union[str, Sequence[str], None] = ${repr(branch_labels)}

# Dependencies.
depends_on: Union[str, Sequence[str], None] = ${repr(depends_on)}


def upgrade() -> None:
    """Upgrade schema."""

    # Alembic itaweka commands za kuongeza/kubadilisha database hapa.
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    """Downgrade schema."""

    # Alembic itaweka commands za kurudisha database nyuma hapa.
    ${downgrades if downgrades else "pass"}