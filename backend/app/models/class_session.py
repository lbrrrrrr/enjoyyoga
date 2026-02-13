import uuid
from datetime import datetime

from sqlalchemy import String, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.yoga_type import Base


class ClassSession(Base):
    """
    Placeholder model for future session-based booking implementation.
    This will eventually represent individual class sessions with specific dates/times.
    """
    __tablename__ = "class_sessions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    class_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("classes.id"))
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    capacity_override: Mapped[int | None] = mapped_column(Integer, nullable=True)  # Override class default capacity
    status: Mapped[str] = mapped_column(String(50))  # scheduled, cancelled, completed
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships (will be added later when needed)
    yoga_class: Mapped["YogaClass"] = relationship("YogaClass")
    # registrations: Mapped[list["Registration"]] = relationship(back_populates="session")