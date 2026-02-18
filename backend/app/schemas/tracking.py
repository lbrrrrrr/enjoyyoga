import uuid
from datetime import datetime, date, time
from typing import Optional, List
from pydantic import BaseModel


class TrackingRegistrationItem(BaseModel):
    registration_id: uuid.UUID
    class_name_en: str
    class_name_zh: str
    status: str
    target_date: Optional[date] = None
    target_time: Optional[time] = None
    created_at: datetime
    payment_status: Optional[str] = None
    reference_number: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None


class TrackingResponse(BaseModel):
    email: str
    registrations: List[TrackingRegistrationItem]
    total: int


class TrackingLinkRequest(BaseModel):
    email: str
    preferred_language: str = "en"
