"""create broadcast tables"""

from alembic import op
import sqlalchemy as sa

revision = 'h2i3j4k5l6m7'
down_revision = 'g1h2i3j4k5l6'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'bot_settings',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('channel_chat_id', sa.String(200), nullable=True),
        sa.Column('channel_title', sa.String(200), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_table(
        'broadcasts',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('admin_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('target', sa.String(20), nullable=False),
        sa.Column('status', sa.String(20), server_default='pending'),
        sa.Column('sent_count', sa.Integer(), server_default='0'),
        sa.Column('failed_count', sa.Integer(), server_default='0'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('broadcasts')
    op.drop_table('bot_settings')
