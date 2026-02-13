import uuid
from datetime import datetime

from sqlalchemy import String, Text, DateTime, func, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.models.yoga_type import Base


class NotificationTemplate(Base):
    __tablename__ = "notification_templates"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    template_type: Mapped[str] = mapped_column(String(50))  # registration_confirmation, reminder_24h
    channel: Mapped[str] = mapped_column(String(20))  # email, sms
    subject_en: Mapped[str] = mapped_column(String(200))
    subject_zh: Mapped[str] = mapped_column(String(200))
    content_en: Mapped[str] = mapped_column(Text)
    content_zh: Mapped[str] = mapped_column(Text)
    variables: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string of available variables
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())