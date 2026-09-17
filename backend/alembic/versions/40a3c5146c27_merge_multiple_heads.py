"""merge multiple heads

Revision ID: 40a3c5146c27
Revises: 405e7123b0f6
Create Date: 2026-09-11 05:02:09.730778

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '40a3c5146c27'
down_revision: Union[str, None] = '405e7123b0f6'
down_revision: Union[str, Sequence[str], None] = '405e7123b0f6'

branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    """Upgrade schema."""

    pass


def downgrade() -> None:

    """Downgrade schema."""

    pass
