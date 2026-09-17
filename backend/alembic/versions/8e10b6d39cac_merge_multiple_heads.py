"""merge multiple heads

Revision ID: 8e10b6d39cac
Revises: 4ba8442827a5
Create Date: 2026-09-11 05:06:19.562534

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8e10b6d39cac'

down_revision: Union[str, None] = '4ba8442827a5'

down_revision: Union[str, Sequence[str], None] = '4ba8442827a5'

branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    """Upgrade schema."""

    pass


def downgrade() -> None:

    """Downgrade schema."""

    pass
