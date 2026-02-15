import uuid
from datetime import datetime

from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.yoga_type import Base


class ContactInquiry(Base):
    __tablename__ = "contact_inquiries"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200))
    email: Mapped[str] = mapped_column(String(300))
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    subject: Mapped[str] = mapped_column(String(500))
    message: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(50))  # "scheduling", "general", "business"
    status: Mapped[str] = mapped_column(String(50), default="open")  # "open", "in_progress", "resolved", "closed"
    preferred_language: Mapped[str] = mapped_column(String(5), default="en")  # "en" or "zh"
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    replies: Mapped[list["InquiryReply"]] = relationship(back_populates="inquiry")