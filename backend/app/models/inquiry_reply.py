import uuid
from datetime import datetime

from sqlalchemy import String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.yoga_type import Base


class InquiryReply(Base):
    __tablename__ = "inquiry_replies"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    inquiry_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("contact_inquiries.id"))
    admin_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("admin_users.id"))
    subject: Mapped[str] = mapped_column(String(500))
    message: Mapped[str] = mapped_column(Text)
    email_status: Mapped[str] = mapped_column(String(50), default="pending")  # "pending", "sent", "failed"
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    inquiry: Mapped["ContactInquiry"] = relationship(back_populates="replies")
    admin: Mapped["AdminUser"] = relationship()