import uuid
from datetime import datetime

from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.yoga_type import Base


class PaymentSettings(Base):
    __tablename__ = "payment_settings"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    wechat_qr_code_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    payment_instructions_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    payment_instructions_zh: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
