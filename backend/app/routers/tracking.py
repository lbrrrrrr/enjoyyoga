from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.registration import Registration
from app.models.yoga_class import YogaClass
from app.schemas.tracking import (
    TrackingRegistrationItem,
    TrackingResponse,
    TrackingLinkRequest,
)
from app.services.tracking_service import TrackingService
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/api/track", tags=["tracking"])


@router.get("/{token}", response_model=TrackingResponse)
async def get_registrations_by_token(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """Look up all registrations for the email associated with this tracking token."""
    tracking_service = TrackingService()
    email = await tracking_service.get_email_by_token(token, db)

    if not email:
        raise HTTPException(status_code=404, detail="Invalid tracking link")

    # Fetch all registrations for this email with related data
    query = (
        select(Registration)
        .where(Registration.email == email)
        .options(
            selectinload(Registration.yoga_class),
            selectinload(Registration.payment),
        )
        .order_by(Registration.created_at.desc())
    )
    result = await db.execute(query)
    registrations = result.scalars().all()

    items = []
    for reg in registrations:
        item = TrackingRegistrationItem(
            registration_id=reg.id,
            class_name_en=reg.yoga_class.name_en if reg.yoga_class else "",
            class_name_zh=reg.yoga_class.name_zh if reg.yoga_class else "",
            status=reg.status,
            target_date=reg.target_date,
            target_time=reg.target_time,
            created_at=reg.created_at,
            payment_status=reg.payment.status if reg.payment else None,
            reference_number=reg.payment.reference_number if reg.payment else None,
            amount=float(reg.payment.amount) if reg.payment else None,
            currency=reg.payment.currency if reg.payment else None,
        )
        items.append(item)

    return TrackingResponse(
        email=email,
        registrations=items,
        total=len(items),
    )


@router.post("/request-link")
async def request_tracking_link(
    data: TrackingLinkRequest,
    db: AsyncSession = Depends(get_db),
):
    """Request a tracking link to be sent to the given email. Always returns 200."""
    tracking_service = TrackingService()
    notification_service = NotificationService()

    token = await tracking_service.get_or_create_token(data.email, db)
    tracking_url = tracking_service.build_tracking_url(
        token.token, locale=data.preferred_language
    )

    await notification_service.send_tracking_link_email(
        data.email, tracking_url, data.preferred_language, db
    )

    return {"message": "If an account exists for this email, a tracking link has been sent."}
