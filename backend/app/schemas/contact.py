import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr


class ContactInquiryCreate(BaseModel):
    """Schema for creating a new contact inquiry."""
    name: str
    email: str
    phone: Optional[str] = None
    subject: str
    message: str
    category: str  # "scheduling", "general", "business"
    preferred_language: str = "en"  # "en" or "zh"


class ContactInquiryOut(BaseModel):
    """Schema for contact inquiry output."""
    id: uuid.UUID
    name: str
    email: str
    phone: Optional[str]
    subject: str
    message: str
    category: str
    status: str
    preferred_language: str
    admin_notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    replies: Optional[List["InquiryReplyOut"]] = []

    model_config = {"from_attributes": True}


class ContactInquiryUpdate(BaseModel):
    """Schema for updating a contact inquiry (admin only)."""
    status: Optional[str] = None  # "open", "in_progress", "resolved", "closed"
    admin_notes: Optional[str] = None


class ContactInquirySummary(BaseModel):
    """Summary schema for listing inquiries."""
    id: uuid.UUID
    name: str
    email: str
    subject: str
    category: str
    status: str
    preferred_language: str
    created_at: datetime

    model_config = {"from_attributes": True}


class InquiryReplyCreate(BaseModel):
    """Schema for creating a new inquiry reply."""
    subject: str
    message: str


class InquiryReplyOut(BaseModel):
    """Schema for inquiry reply output."""
    id: uuid.UUID
    inquiry_id: uuid.UUID
    admin_id: uuid.UUID
    subject: str
    message: str
    email_status: str
    error_message: Optional[str]
    created_at: datetime
    sent_at: Optional[datetime]

    model_config = {"from_attributes": True}


# Forward reference resolution
ContactInquiryOut.model_rebuild()