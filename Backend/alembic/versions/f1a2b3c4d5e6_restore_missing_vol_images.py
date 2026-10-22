"""restore missing volume images table

Revision ID: f1a2b3c4d5e6
Revises: bc2d3b4a2c02
Create Date: 2026-10-22

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "bc2d3b4a2c02"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if not sa.inspect(bind).has_table("vol_images"):
        op.create_table(
            "vol_images",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("vol_id", sa.Integer(), nullable=False),
            sa.Column("image_url", sa.String(), nullable=False),
            sa.Column("storage_key", sa.String(), nullable=True),
            sa.ForeignKeyConstraint(["vol_id"], ["vols.id"]),
            sa.PrimaryKeyConstraint("id"),
        )


def downgrade() -> None:
    pass
