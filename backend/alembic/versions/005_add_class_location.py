"""Add location column to classes table.

Revision ID: 005_add_class_location
Revises: 004_standardize_schedule
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "005_add_class_location"
down_revision = "004_standardize_schedule"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("classes", sa.Column("location", sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column("classes", "location")
