"""add mandatory fields to subjects

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-23
"""
from alembic import op
import sqlalchemy as sa

revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('subjects', sa.Column('is_mandatory', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('subjects', sa.Column('mandatory_question_count', sa.Integer(), server_default='10', nullable=False))


def downgrade() -> None:
    op.drop_column('subjects', 'mandatory_question_count')
    op.drop_column('subjects', 'is_mandatory')
