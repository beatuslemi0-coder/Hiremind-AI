"""merge multiple heads

Revision ID: 411eb1f2add3
Revises: 8e10b6d39cac
Create Date: 2026-09-11 05:16:46.622029

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '411eb1f2add3'

down_revision: Union[str, None] = '8e10b6d39cac'

down_revision: Union[str, Sequence[str], None] = '8e10b6d39cac'

branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    """Upgrade schema."""

    pass


def downgrade() -> None:

    """Downgrade schema."""

    pass
