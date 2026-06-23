"""make payment_id nullable in test_variants

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-06-23
"""
from alembic import op
import sqlalchemy as sa

revision = 'c3d4e5f6a7b8'
down_revision = 'b2c3d4e5f6a7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column('test_variants', 'payment_id', existing_type=sa.Integer(), nullable=True)


def downgrade() -> None:
    op.alter_column('test_variants', 'payment_id', existing_type=sa.Integer(), nullable=False)
