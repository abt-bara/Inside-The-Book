"""empty message

Revision ID: bc2d3b4a2c02
Revises: 82ca59345b37
Create Date: 2026-10-17 11:52:23.036820

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bc2d3b4a2c02'
down_revision: Union[str, Sequence[str], None] = '82ca59345b37'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
