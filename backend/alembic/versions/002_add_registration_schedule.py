"""add registration schedule fields

Revision ID: 002
Revises: 001
Create Date: 2026-02-12
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns to registrations table
    op.add_column('registrations', sa.Column('target_date', sa.Date(), nullable=True))
    op.add_column('registrations', sa.Column('target_time', sa.Time(), nullable=True))
    op.add_column('registrations', sa.Column('session_id', sa.Uuid(), nullable=True))
    op.add_column('registrations', sa.Column('status', sa.String(50), nullable=False, server_default='confirmed'))

    # Add new columns to classes table
    op.add_column('classes', sa.Column('schedule_data', sa.Text(), nullable=True))
    op.add_column('classes', sa.Column('schedule_type', sa.String(20), nullable=False, server_default='recurring'))
    op.add_column('classes', sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'))

    # Create placeholder class_sessions table for future use
    op.create_table('class_sessions',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('class_id', sa.Uuid(), nullable=False),
        sa.Column('start_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('capacity_override', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['class_id'], ['classes.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Add foreign key for future session reference
    op.create_foreign_key('fk_registrations_session_id', 'registrations', 'class_sessions', ['session_id'], ['id'])


def downgrade() -> None:
    # Drop foreign key constraint first
    op.drop_constraint('fk_registrations_session_id', 'registrations', type_='foreignkey')

    # Drop class_sessions table
    op.drop_table('class_sessions')

    # Remove new columns from classes table
    op.drop_column('classes', 'is_active')
    op.drop_column('classes', 'schedule_type')
    op.drop_column('classes', 'schedule_data')

    # Remove new columns from registrations table
    op.drop_column('registrations', 'status')
    op.drop_column('registrations', 'session_id')
    op.drop_column('registrations', 'target_time')
    op.drop_column('registrations', 'target_date')