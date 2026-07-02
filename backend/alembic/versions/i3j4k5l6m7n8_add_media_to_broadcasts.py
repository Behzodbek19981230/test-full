"""add media columns to broadcasts"""

from alembic import op
import sqlalchemy as sa

revision = 'i3j4k5l6m7n8'
down_revision = 'h2i3j4k5l6m7'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('broadcasts', sa.Column('media_path', sa.String(500), nullable=True))
    op.add_column('broadcasts', sa.Column('media_type', sa.String(20), nullable=True))


def downgrade():
    op.drop_column('broadcasts', 'media_type')
    op.drop_column('broadcasts', 'media_path')
