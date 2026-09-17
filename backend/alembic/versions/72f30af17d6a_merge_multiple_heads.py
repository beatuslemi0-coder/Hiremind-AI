"""merge multiple heads

Revision ID: 72f30af17d6a
Revises: 32cba1f72fcf, 6de30078777b
Create Date: 2026-09-11 04:57:37.458384

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '72f30af17d6a'

down_revision: Union[str, None] = ('32cba1f72fcf', '6de30078777b')

down_revision: Union[str, Sequence[str], None] = ('32cba1f72fcf', '6de30078777b')

branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    """Upgrade schema."""

    pass


def downgrade() -> None:

    """Downgrade schema."""
    pass