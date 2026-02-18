import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.yoga_type import Base


class ConsentRecord(Base):
    __tablename__ = "consent_records"
    __table_args__ = (
        UniqueConstraint("email", "yoga_type_id", name="uq_consent_email_yoga_type"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(300), index=True)
    name: Mapped[str] = mapped_column(String(200))
    yoga_type_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("yoga_types.id"))
    consent_text_version: Mapped[str] = mapped_column(String(50), default="1.0")
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    signed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    yoga_type: Mapped["YogaType"] = relationship()
