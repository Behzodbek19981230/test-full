"""add is_free to subjects

Revision ID: a1b2c3d4e5f7
Revises: e5f6a7b8c9d0
Create Date: 2026-06-25
"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f7'
down_revision = 'f6a7b8c9d0e1'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('subjects', sa.Column('is_free', sa.Boolean(), server_default=sa.text('false'), nullable=False))


def downgrade():
    op.drop_column('subjects', 'is_free')
