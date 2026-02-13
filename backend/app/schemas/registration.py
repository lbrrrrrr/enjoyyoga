import uuid
from datetime import datetime, date, time
from typing import Optional

from pydantic import BaseModel, EmailStr


class RegistrationCreate(BaseModel):
    class_id: uuid.UUID
    name: str
    email: str
    phone: str | None = None
    message: str | None = None


class RegistrationCreateWithSchedule(BaseModel):
    """Enhanced registration schema with schedule support."""
    class_id: uuid.UUID
    name: str
    email: str
    phone: str | None = None
    message: str | None = None
    target_date: Optional[date] = None  # When user wants to attend
    target_time: Optional[time] = None  # Specific time slot
    # New notification preferences
    preferred_language: str = "en"
    email_notifications: bool = True
    sms_notifications: bool = False


class RegistrationOut(BaseModel):
    id: uuid.UUID
    class_id: uuid.UUID
    name: str
    email: str
    phone: str | None
    message: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


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

    model_config = {"from_attributes": True}


class AvailableDateOut(BaseModel):
    """Schema for available class dates."""
    date_time: datetime
    formatted_date: str
    formatted_time: str
    available_spots: int
