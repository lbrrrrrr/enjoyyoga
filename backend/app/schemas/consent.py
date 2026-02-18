import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ConsentCreate(BaseModel):
    """Schema for signing a consent waiver."""
    email: str
    name: str
    yoga_type_id: uuid.UUID
    consent_text_version: str = "1.0"


class ConsentOut(BaseModel):
    """Schema for consent record output."""
    id: uuid.UUID
    email: str
    name: str
    yoga_type_id: uuid.UUID
    consent_text_version: str
    ip_address: Optional[str]
    user_id: Optional[uuid.UUID]
    signed_at: datetime

    model_config = {"from_attributes": True}


class ConsentCheckResult(BaseModel):
    """Schema for consent check response."""
    has_consent: bool
    consent: Optional[ConsentOut] = None


class ConsentListItem(BaseModel):
    """Schema for listing consent records in admin."""
    id: uuid.UUID
    email: str
    name: str
    yoga_type_id: uuid.UUID
    yoga_type_name_en: Optional[str] = None
    yoga_type_name_zh: Optional[str] = None
    consent_text_version: str
    signed_at: datetime

    model_config = {"from_attributes": True}
