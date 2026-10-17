"""empty message

Revision ID: 42e50132788b
Revises: 2b8203d75b5d
Create Date: 2026-10-17 10:33:20.601656

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '42e50132788b'
down_revision: Union[str, Sequence[str], None] = '2b8203d75b5d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
