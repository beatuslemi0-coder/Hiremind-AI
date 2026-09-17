"""merge multiple heads

Revision ID: 4ba8442827a5
Revises: 40a3c5146c27
Create Date: 2026-09-11 05:04:11.136485

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4ba8442827a5'

down_revision: Union[str, None] = '40a3c5146c27'

down_revision: Union[str, Sequence[str], None] = '40a3c5146c27'

branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    """Upgrade schema."""

    pass


def downgrade() -> None:

    """Downgrade schema."""

    pass
