import uuid
from datetime import datetime, date, time
from typing import Optional

from pydantic import BaseModel, EmailStr
from app.schemas.payment import PaymentOut


class RegistrationCreateWithSchedule(BaseModel):
    """Registration schema with required schedule fields."""
    class_id: uuid.UUID
    name: str
    email: str
    phone: str | None = None
    message: str | None = None
    target_date: date
    target_time: time
    # New notification preferences
    preferred_language: str = "en"
    email_notifications: bool = True
    sms_notifications: bool = False
    # Payment support
    package_id: Optional[uuid.UUID] = None
    payment_method: Optional[str] = None  # "wechat_qr" or "venmo_qr"


class RegistrationOutWithSchedule(BaseModel):
    """Enhanced registration output schema with schedule fields."""
    id: uuid.UUID
    class_id: uuid.UUID
    name: str
    email: str
    phone: str | None
    message: str | None
    created_at: datetime
    # Schedule fields
    target_date: Optional[date]
    target_time: Optional[time]
    status: str
    # Notification fields
    email_confirmation_sent: bool
    reminder_sent: bool
    preferred_language: str
    email_notifications: bool
    sms_notifications: bool
    # Payment
    payment: Optional[PaymentOut] = None

    model_config = {"from_attributes": True}


class AvailableDateOut(BaseModel):
    """Schema for available class dates."""
    date_time: datetime
    formatted_date: str
    formatted_time: str
    available_spots: int
