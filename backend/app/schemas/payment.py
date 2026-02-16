import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class ClassPackageCreate(BaseModel):
    class_id: uuid.UUID
    name_en: str
    name_zh: str
    description_en: str = ""
    description_zh: str = ""
    session_count: int
    price: float
    currency: str = "CNY"
    is_active: bool = True


class ClassPackageUpdate(BaseModel):
    name_en: Optional[str] = None
    name_zh: Optional[str] = None
    description_en: Optional[str] = None
    description_zh: Optional[str] = None
    session_count: Optional[int] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    is_active: Optional[bool] = None


class ClassPackageOut(BaseModel):
    id: uuid.UUID
    class_id: uuid.UUID
    name_en: str
    name_zh: str
    description_en: str
    description_zh: str
    session_count: int
    price: float
    currency: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PaymentOut(BaseModel):
    id: uuid.UUID
    registration_id: Optional[uuid.UUID]
    amount: float
    currency: str
    payment_method: str
    status: str
    reference_number: str
    payment_type: str
    package_id: Optional[uuid.UUID]
    admin_notes: Optional[str]
    confirmed_by: Optional[uuid.UUID]
    confirmed_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class PaymentConfirm(BaseModel):
    admin_notes: Optional[str] = None


class PaymentReject(BaseModel):
    admin_notes: Optional[str] = None


class PaymentSettingsOut(BaseModel):
    id: uuid.UUID
    wechat_qr_code_url: Optional[str]
    payment_instructions_en: Optional[str]
    payment_instructions_zh: Optional[str]
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaymentSettingsUpdate(BaseModel):
    payment_instructions_en: Optional[str] = None
    payment_instructions_zh: Optional[str] = None


class PaymentInfoOut(BaseModel):
    """Public-facing payment info after registration."""
    payment_id: uuid.UUID
    reference_number: str
    amount: float
    currency: str
    status: str
    wechat_qr_code_url: Optional[str]
    payment_instructions_en: Optional[str]
    payment_instructions_zh: Optional[str]
    created_at: datetime


class PaymentStatsOut(BaseModel):
    total_payments: int
    pending_payments: int
    confirmed_payments: int
    cancelled_payments: int
    total_revenue: float
