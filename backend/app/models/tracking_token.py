import uuid
import secrets
from datetime import datetime

from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.yoga_type import Base


class TrackingToken(Base):
    __tablename__ = "tracking_tokens"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(300), unique=True, index=True)
    token: Mapped[str] = mapped_column(String(64), unique=True, index=True, default=lambda: secrets.token_hex(32))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
