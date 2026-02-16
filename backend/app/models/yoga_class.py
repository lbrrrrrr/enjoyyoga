import uuid
from datetime import datetime

from sqlalchemy import String, Text, Integer, Numeric, DateTime, ForeignKey, func, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.yoga_type import Base


class YogaClass(Base):
    __tablename__ = "classes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name_en: Mapped[str] = mapped_column(String(200))
    name_zh: Mapped[str] = mapped_column(String(200))
    description_en: Mapped[str] = mapped_column(Text, default="")
    description_zh: Mapped[str] = mapped_column(Text, default="")
    teacher_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("teachers.id"))
    yoga_type_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("yoga_types.id"))
    schedule: Mapped[str] = mapped_column(String(200))  # Keep for backward compatibility
    duration_minutes: Mapped[int] = mapped_column(Integer)
    difficulty: Mapped[str] = mapped_column(String(50))
    capacity: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # NEW FIELDS for schedule integration
    schedule_data: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON structure
    schedule_type: Mapped[str] = mapped_column(String(20), default="recurring")  # recurring, one_time, custom
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)  # Enable/disable class

    # Pricing fields
    price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)  # null means free (CNY)
    price_usd: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)  # null means not available in USD
    currency: Mapped[str] = mapped_column(String(10), default="CNY")

    teacher: Mapped["Teacher"] = relationship(back_populates="classes")
    yoga_type: Mapped["YogaType"] = relationship(back_populates="classes")
    registrations: Mapped[list["Registration"]] = relationship(back_populates="yoga_class")
    packages: Mapped[list["ClassPackage"]] = relationship(back_populates="yoga_class", lazy="selectin")
