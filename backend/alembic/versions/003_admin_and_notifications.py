"""admin and notifications support

Revision ID: 003
Revises: 002
Create Date: 2026-02-13
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create admin_users table
    op.create_table(
        'admin_users',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('username', sa.String(100), nullable=False),
        sa.Column('email', sa.String(300), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('role', sa.String(50), nullable=False, server_default='admin'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username'),
        sa.UniqueConstraint('email')
    )

    # Create notification_templates table
    op.create_table(
        'notification_templates',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('template_type', sa.String(50), nullable=False),
        sa.Column('channel', sa.String(20), nullable=False),
        sa.Column('subject_en', sa.String(200), nullable=False),
        sa.Column('subject_zh', sa.String(200), nullable=False),
        sa.Column('content_en', sa.Text(), nullable=False),
        sa.Column('content_zh', sa.Text(), nullable=False),
        sa.Column('variables', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Extend registrations table with notification fields
    op.add_column('registrations', sa.Column('email_confirmation_sent', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('registrations', sa.Column('reminder_sent', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('registrations', sa.Column('preferred_language', sa.String(5), nullable=False, server_default='en'))
    op.add_column('registrations', sa.Column('email_notifications', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('registrations', sa.Column('sms_notifications', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    # Remove notification fields from registrations table
    op.drop_column('registrations', 'sms_notifications')
    op.drop_column('registrations', 'email_notifications')
    op.drop_column('registrations', 'preferred_language')
    op.drop_column('registrations', 'reminder_sent')
    op.drop_column('registrations', 'email_confirmation_sent')

    # Drop notification_templates table
    op.drop_table('notification_templates')

    # Drop admin_users table
    op.drop_table('admin_users')