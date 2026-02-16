import uuid
from datetime import datetime

from sqlalchemy import String, Text, Numeric, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.yoga_type import Base


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    registration_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("registrations.id"), nullable=True)
    amount: Mapped[float] = mapped_column(Numeric(10, 2))
    currency: Mapped[str] = mapped_column(String(10), default="CNY")
    payment_method: Mapped[str] = mapped_column(String(50), default="wechat_qr")
    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending, confirmed, cancelled, refunded
    reference_number: Mapped[str] = mapped_column(String(50), unique=True)
    payment_type: Mapped[str] = mapped_column(String(50), default="single_session")  # single_session, package
    package_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("class_packages.id"), nullable=True)
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    confirmed_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("admin_users.id"), nullable=True)
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    registration: Mapped["Registration"] = relationship(back_populates="payment")
    package: Mapped["ClassPackage"] = relationship()
    confirmed_by_admin: Mapped["AdminUser"] = relationship()
