"""merge multiple heads

Revision ID: 405e7123b0f6
Revises: 72f30af17d6a
Create Date: 2026-09-11 05:00:16.275066

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '405e7123b0f6'

down_revision: Union[str, None] = '72f30af17d6a'

down_revision: Union[str, Sequence[str], None] = '72f30af17d6a'

branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    """Upgrade schema."""

    pass


def downgrade() -> None:

    """Downgrade schema."""

    pass
