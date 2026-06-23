"""add is_mixed to topics

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-06-23
"""
from alembic import op
import sqlalchemy as sa

revision = 'e5f6a7b8c9d0'
down_revision = 'd4e5f6a7b8c9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('topics', sa.Column('is_mixed', sa.Boolean(), server_default='false', nullable=False))


def downgrade() -> None:
    op.drop_column('topics', 'is_mixed')
