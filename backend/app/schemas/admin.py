import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class AdminLoginSchema(BaseModel):
    username: str
    password: str


class AdminUserOut(BaseModel):
    id: uuid.UUID
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminTokenOut(BaseModel):
    access_token: str
    token_type: str
    admin: AdminUserOut


class RegistrationStatusUpdate(BaseModel):
    status: str  # confirmed, waitlist, cancelled


class AdminStatsOut(BaseModel):
    total_registrations: int
    total_teachers: int
    total_classes: int
    recent_registrations: list  # Will be typed more specifically later
    pending_payments: int = 0
    total_revenue: float = 0.0


class NotificationTemplateOut(BaseModel):
    id: uuid.UUID
    template_type: str
    channel: str
    subject_en: str
    subject_zh: str
    content_en: str
    content_zh: str
    variables: Optional[str]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationTemplateCreate(BaseModel):
    template_type: str
    channel: str
    subject_en: str
    subject_zh: str
    content_en: str
    content_zh: str
    variables: Optional[str] = None
    is_active: bool = True