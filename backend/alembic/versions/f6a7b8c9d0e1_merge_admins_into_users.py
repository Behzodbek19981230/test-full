"""merge admins into users table

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-06-24
"""
from alembic import op
import sqlalchemy as sa

revision = 'f6a7b8c9d0e1'
down_revision = 'e5f6a7b8c9d0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('login', sa.String(100), nullable=True))
    op.add_column('users', sa.Column('password_hash', sa.String(256), nullable=True))

    # 1) Drop old FK constraints pointing to admins
    try:
        op.drop_constraint('audit_logs_admin_id_fkey', 'audit_logs', type_='foreignkey')
    except Exception:
        pass
    try:
        op.drop_constraint('notifications_admin_id_fkey', 'notifications', type_='foreignkey')
    except Exception:
        pass
    try:
        op.drop_constraint('payments_admin_id_fkey', 'payments', type_='foreignkey')
    except Exception:
        pass

    # 2) Copy admins into users and remap IDs
    conn = op.get_bind()
    admins = conn.execute(sa.text("SELECT id, username, password_hash, full_name, role FROM admins")).fetchall()

    for admin in admins:
        conn.execute(
            sa.text(
                "INSERT INTO users (login, password_hash, full_name, role) "
                "VALUES (:login, :password_hash, :full_name, :role)"
            ),
            {"login": admin[1], "password_hash": admin[2], "full_name": admin[3], "role": admin[4]},
        )

    admin_map = {}
    for admin in admins:
        new_user = conn.execute(
            sa.text("SELECT id FROM users WHERE login = :login"),
            {"login": admin[1]},
        ).fetchone()
        if new_user:
            admin_map[admin[0]] = new_user[0]

    # 3) Update references
    for old_id, new_id in admin_map.items():
        conn.execute(sa.text("UPDATE audit_logs SET admin_id = :new_id WHERE admin_id = :old_id"), {"new_id": new_id, "old_id": old_id})
        conn.execute(sa.text("UPDATE notifications SET admin_id = :new_id WHERE admin_id = :old_id"), {"new_id": new_id, "old_id": old_id})
        conn.execute(sa.text("UPDATE payments SET admin_id = :new_id WHERE admin_id = :old_id"), {"new_id": new_id, "old_id": old_id})

    # 4) Create new FK constraints pointing to users
    op.create_foreign_key('audit_logs_admin_id_fkey', 'audit_logs', 'users', ['admin_id'], ['id'])
    op.create_foreign_key('notifications_admin_id_fkey', 'notifications', 'users', ['admin_id'], ['id'])
    op.create_foreign_key('payments_admin_id_fkey', 'payments', 'users', ['admin_id'], ['id'])

    # 5) Drop admins table and create index
    op.drop_table('admins')
    op.create_index('ix_users_login', 'users', ['login'], unique=True)


def downgrade() -> None:
    op.create_table(
        'admins',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('username', sa.String(100), unique=True, nullable=False),
        sa.Column('password_hash', sa.String(256), nullable=False),
        sa.Column('full_name', sa.String(200), nullable=False),
        sa.Column('role', sa.String(50), nullable=False, server_default='admin'),
        sa.Column('created_at', sa.DateTime()),
    )

    op.drop_constraint('audit_logs_admin_id_fkey', 'audit_logs', type_='foreignkey')
    op.drop_constraint('notifications_admin_id_fkey', 'notifications', type_='foreignkey')
    op.drop_constraint('payments_admin_id_fkey', 'payments', type_='foreignkey')
    op.create_foreign_key('audit_logs_admin_id_fkey', 'audit_logs', 'admins', ['admin_id'], ['id'])
    op.create_foreign_key('notifications_admin_id_fkey', 'notifications', 'admins', ['admin_id'], ['id'])
    op.create_foreign_key('payments_admin_id_fkey', 'payments', 'admins', ['admin_id'], ['id'])

    op.drop_index('ix_users_login', 'users')
    op.drop_column('users', 'password_hash')
    op.drop_column('users', 'login')
