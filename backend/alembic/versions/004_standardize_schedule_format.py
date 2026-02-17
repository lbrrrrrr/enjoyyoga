"""Standardize schedule format.

Data-only migration: normalizes existing yoga_class.schedule values to the
canonical format ``Mon/Wed/Fri 7:00 AM``.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "004_standardize_schedule"
down_revision = "5fb47ed06aeb"
branch_labels = None
depends_on = None


def upgrade() -> None:
    from app.services.schedule_parser import ScheduleParserService

    conn = op.get_bind()
    rows = conn.execute(sa.text("SELECT id, schedule FROM classes")).fetchall()

    for row_id, schedule in rows:
        if not schedule:
            continue
        normalized = ScheduleParserService.normalize_schedule(schedule)
        if normalized != schedule:
            conn.execute(
                sa.text("UPDATE classes SET schedule = :schedule WHERE id = :id"),
                {"schedule": normalized, "id": row_id},
            )


def downgrade() -> None:
    # Data-only migration – original values are not stored, so downgrade is a no-op.
    pass
