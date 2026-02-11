"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-02-10
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "yoga_types",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name_en", sa.String(200), nullable=False),
        sa.Column("name_zh", sa.String(200), nullable=False),
        sa.Column("description_en", sa.Text(), nullable=False, server_default=""),
        sa.Column("description_zh", sa.Text(), nullable=False, server_default=""),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "teachers",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name_en", sa.String(200), nullable=False),
        sa.Column("name_zh", sa.String(200), nullable=False),
        sa.Column("bio_en", sa.Text(), nullable=False, server_default=""),
        sa.Column("bio_zh", sa.Text(), nullable=False, server_default=""),
        sa.Column("qualifications", sa.Text(), nullable=False, server_default=""),
        sa.Column("photo_url", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "classes",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name_en", sa.String(200), nullable=False),
        sa.Column("name_zh", sa.String(200), nullable=False),
        sa.Column("description_en", sa.Text(), nullable=False, server_default=""),
        sa.Column("description_zh", sa.Text(), nullable=False, server_default=""),
        sa.Column("teacher_id", sa.Uuid(), nullable=False),
        sa.Column("yoga_type_id", sa.Uuid(), nullable=False),
        sa.Column("schedule", sa.String(200), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("difficulty", sa.String(50), nullable=False),
        sa.Column("capacity", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["teacher_id"], ["teachers.id"]),
        sa.ForeignKeyConstraint(["yoga_type_id"], ["yoga_types.id"]),
    )

    op.create_table(
        "registrations",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("class_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("email", sa.String(300), nullable=False),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["class_id"], ["classes.id"]),
    )


def downgrade() -> None:
    op.drop_table("registrations")
    op.drop_table("classes")
    op.drop_table("teachers")
    op.drop_table("yoga_types")
