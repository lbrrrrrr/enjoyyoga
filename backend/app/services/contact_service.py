import uuid
from typing import List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, and_
from sqlalchemy.orm import selectinload

from app.models.contact_inquiry import ContactInquiry
from app.models.inquiry_reply import InquiryReply
from app.schemas.contact import ContactInquiryCreate, ContactInquiryUpdate


class ContactService:
    """Service for handling contact inquiry operations."""

    async def create_inquiry(self, inquiry_data: ContactInquiryCreate, db: AsyncSession) -> ContactInquiry:
        """Create a new contact inquiry."""
        inquiry = ContactInquiry(**inquiry_data.model_dump())
        db.add(inquiry)
        await db.commit()

        # Fetch the inquiry with eager-loaded replies to avoid lazy loading issues
        query = select(ContactInquiry).where(ContactInquiry.id == inquiry.id).options(selectinload(ContactInquiry.replies))
        result = await db.execute(query)
        return result.scalar_one()

    async def get_inquiry_by_id(self, inquiry_id: uuid.UUID, db: AsyncSession) -> Optional[ContactInquiry]:
        """Get a specific inquiry by ID."""
        query = select(ContactInquiry).where(ContactInquiry.id == inquiry_id).options(selectinload(ContactInquiry.replies))
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def get_all_inquiries(
        self,
        db: AsyncSession,
        status: Optional[str] = None,
        category: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[ContactInquiry]:
        """Get all contact inquiries with optional filtering."""
        query = select(ContactInquiry).order_by(desc(ContactInquiry.created_at))

        # Apply filters
        conditions = []
        if status:
            conditions.append(ContactInquiry.status == status)
        if category:
            conditions.append(ContactInquiry.category == category)

        if conditions:
            query = query.where(and_(*conditions))

        query = query.offset(offset).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def update_inquiry(
        self,
        inquiry_id: uuid.UUID,
        update_data: ContactInquiryUpdate,
        db: AsyncSession
    ) -> Optional[ContactInquiry]:
        """Update an existing inquiry (admin only)."""
        inquiry = await self.get_inquiry_by_id(inquiry_id, db)
        if not inquiry:
            return None

        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(inquiry, field, value)

        await db.commit()
        await db.refresh(inquiry)
        return inquiry

    async def get_inquiry_stats(self, db: AsyncSession) -> dict:
        """Get statistics about contact inquiries for admin dashboard."""
        # Count by status
        status_counts = {}
        for status in ["open", "in_progress", "resolved", "closed"]:
            query = select(ContactInquiry).where(ContactInquiry.status == status)
            result = await db.execute(query)
            status_counts[status] = len(result.scalars().all())

        # Count by category
        category_counts = {}
        for category in ["scheduling", "general", "business"]:
            query = select(ContactInquiry).where(ContactInquiry.category == category)
            result = await db.execute(query)
            category_counts[category] = len(result.scalars().all())

        return {
            "total_inquiries": sum(status_counts.values()),
            "by_status": status_counts,
            "by_category": category_counts
        }

    async def create_reply(
        self,
        inquiry_id: uuid.UUID,
        admin_id: uuid.UUID,
        subject: str,
        message: str,
        db: AsyncSession
    ) -> InquiryReply:
        """Create a new reply to a contact inquiry."""
        reply = InquiryReply(
            inquiry_id=inquiry_id,
            admin_id=admin_id,
            subject=subject,
            message=message,
            email_status="pending"
        )
        db.add(reply)
        await db.commit()
        await db.refresh(reply)
        return reply

    async def update_reply_status(
        self,
        reply_id: uuid.UUID,
        email_status: str,
        db: AsyncSession,
        error_message: Optional[str] = None
    ) -> Optional[InquiryReply]:
        """Update the email status of a reply."""
        query = select(InquiryReply).where(InquiryReply.id == reply_id)
        result = await db.execute(query)
        reply = result.scalar_one_or_none()

        if not reply:
            return None

        reply.email_status = email_status
        reply.error_message = error_message

        # Set sent_at timestamp when email is successfully sent
        if email_status == "sent":
            reply.sent_at = datetime.utcnow()

        await db.commit()
        await db.refresh(reply)
        return reply