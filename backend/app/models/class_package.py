import uuid
from datetime import datetime

from sqlalchemy import String, Text, Integer, Numeric, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.yoga_type import Base


class ClassPackage(Base):
    __tablename__ = "class_packages"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    class_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("classes.id"))
    name_en: Mapped[str] = mapped_column(String(200))
    name_zh: Mapped[str] = mapped_column(String(200))
    description_en: Mapped[str] = mapped_column(Text, default="")
    description_zh: Mapped[str] = mapped_column(Text, default="")
    session_count: Mapped[int] = mapped_column(Integer)
    price: Mapped[float] = mapped_column(Numeric(10, 2))
    price_usd: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="CNY")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    yoga_class: Mapped["YogaClass"] = relationship(back_populates="packages")
