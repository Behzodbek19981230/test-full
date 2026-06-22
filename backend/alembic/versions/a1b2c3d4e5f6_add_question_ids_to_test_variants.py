"""add question_ids, answer fields to test_variants

Revision ID: a1b2c3d4e5f6
Revises: 748d437ccb74
Create Date: 2026-06-22 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '748d437ccb74'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('test_variants', sa.Column('question_ids', sa.Text(), nullable=True))
    op.add_column('test_variants', sa.Column('user_answers', sa.String(500), nullable=True))
    op.add_column('test_variants', sa.Column('correct_count', sa.Integer(), nullable=True))
    op.add_column('test_variants', sa.Column('score', sa.Integer(), nullable=True))
    op.add_column('test_variants', sa.Column('checked_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('test_variants', 'checked_at')
    op.drop_column('test_variants', 'score')
    op.drop_column('test_variants', 'correct_count')
    op.drop_column('test_variants', 'user_answers')
    op.drop_column('test_variants', 'question_ids')
