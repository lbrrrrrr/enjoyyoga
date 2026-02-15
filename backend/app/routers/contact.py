import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth import get_current_admin
from app.models.admin_user import AdminUser
from app.schemas.contact import (
    ContactInquiryCreate,
    ContactInquiryOut,
    ContactInquiryUpdate,
    ContactInquirySummary,
    InquiryReplyCreate,
    InquiryReplyOut
)
from app.services.contact_service import ContactService
from app.services.notification_service import NotificationService

# Public router for contact form submissions
router = APIRouter(prefix="/api/contact", tags=["contact"])

# Admin router for managing inquiries
admin_router = APIRouter(prefix="/api/admin/contact", tags=["admin-contact"])


@router.post("/inquiries", response_model=ContactInquiryOut, status_code=201)
async def submit_inquiry(
    inquiry_data: ContactInquiryCreate,
    db: AsyncSession = Depends(get_db)
):
    """Submit a new contact inquiry (public endpoint)."""
    contact_service = ContactService()
    notification_service = NotificationService()

    try:
        # Create the inquiry
        inquiry = await contact_service.create_inquiry(inquiry_data, db)

        # Send confirmation email to user
        await notification_service.send_inquiry_confirmation_email(inquiry, db)

        # Send notification email to admin
        await notification_service.send_admin_inquiry_notification(inquiry, db)

        return inquiry

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit inquiry: {str(e)}")


@admin_router.get("/inquiries", response_model=List[ContactInquirySummary])
async def list_inquiries(
    status: Optional[str] = Query(None, pattern="^(open|in_progress|resolved|closed)$"),
    category: Optional[str] = Query(None, pattern="^(scheduling|general|business)$"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Get list of contact inquiries (admin only)."""
    contact_service = ContactService()
    inquiries = await contact_service.get_all_inquiries(
        db, status=status, category=category, limit=limit, offset=offset
    )
    return inquiries


@admin_router.get("/inquiries/{inquiry_id}", response_model=ContactInquiryOut)
async def get_inquiry(
    inquiry_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Get a specific inquiry by ID (admin only)."""
    contact_service = ContactService()
    inquiry = await contact_service.get_inquiry_by_id(inquiry_id, db)

    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    return inquiry


@admin_router.put("/inquiries/{inquiry_id}", response_model=ContactInquiryOut)
async def update_inquiry(
    inquiry_id: uuid.UUID,
    update_data: ContactInquiryUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Update an inquiry status and notes (admin only)."""
    contact_service = ContactService()
    inquiry = await contact_service.update_inquiry(inquiry_id, update_data, db)

    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    return inquiry


@admin_router.get("/stats")
async def get_inquiry_stats(
    db: AsyncSession = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Get contact inquiry statistics for admin dashboard."""
    contact_service = ContactService()
    stats = await contact_service.get_inquiry_stats(db)
    return stats


@admin_router.post("/inquiries/{inquiry_id}/replies", response_model=InquiryReplyOut, status_code=201)
async def create_reply(
    inquiry_id: uuid.UUID,
    reply_data: InquiryReplyCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Create a reply to a contact inquiry (admin only)."""
    contact_service = ContactService()
    notification_service = NotificationService()

    try:
        # Verify the inquiry exists
        inquiry = await contact_service.get_inquiry_by_id(inquiry_id, db)
        if not inquiry:
            raise HTTPException(status_code=404, detail="Inquiry not found")

        # Create the reply
        reply = await contact_service.create_reply(
            inquiry_id=inquiry_id,
            admin_id=current_admin.id,
            subject=reply_data.subject,
            message=reply_data.message,
            db=db
        )

        # Send reply email to user
        email_sent = await notification_service.send_inquiry_reply_email(reply, inquiry, db)

        # Update reply status based on email result
        if email_sent:
            await contact_service.update_reply_status(reply.id, "sent", db)
        else:
            await contact_service.update_reply_status(reply.id, "failed", db, error_message="Failed to send email")

        # Refresh reply to get updated status
        await db.refresh(reply)
        return reply

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create reply: {str(e)}")