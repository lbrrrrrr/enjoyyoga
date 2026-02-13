import uuid
from datetime import datetime, date, time

from sqlalchemy import String, Text, DateTime, Date, Time, ForeignKey, func, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.yoga_type import Base


class Registration(Base):
    __tablename__ = "registrations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    class_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("classes.id"))
    name: Mapped[str] = mapped_column(String(200))
    email: Mapped[str] = mapped_column(String(300))
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # NEW FIELDS for schedule integration
    target_date: Mapped[date | None] = mapped_column(Date, nullable=True)  # When user wants to attend
    target_time: Mapped[time | None] = mapped_column(Time, nullable=True)  # Specific time slot
    session_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("class_sessions.id"), nullable=True)  # Future session reference
    status: Mapped[str] = mapped_column(String(50), default="confirmed")  # confirmed, waitlist, cancelled

    # NEW FIELDS for notifications
    email_confirmation_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    reminder_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    preferred_language: Mapped[str] = mapped_column(String(5), default="en")
    email_notifications: Mapped[bool] = mapped_column(Boolean, default=True)
    sms_notifications: Mapped[bool] = mapped_column(Boolean, default=False)

    yoga_class: Mapped["YogaClass"] = relationship(back_populates="registrations")
