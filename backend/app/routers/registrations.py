import uuid
from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.registration import Registration
from app.models.yoga_class import YogaClass
from app.schemas.registration import (
    RegistrationCreate,
    RegistrationOut,
    RegistrationCreateWithSchedule,
    RegistrationOutWithSchedule,
    AvailableDateOut
)
from app.services.registration_service import RegistrationService
from app.services.schedule_parser import ScheduleParserService
from app.services.notification_service import NotificationService
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/api/registrations", tags=["registrations"])


@router.post("", response_model=RegistrationOut, status_code=201)
async def create_registration(data: RegistrationCreate, db: AsyncSession = Depends(get_db)):
    """Backward compatible registration endpoint."""
    registration = Registration(**data.model_dump())
    db.add(registration)
    await db.commit()
    await db.refresh(registration)
    return registration


@router.post("/with-schedule", response_model=RegistrationOutWithSchedule, status_code=201)
async def create_registration_with_schedule(
    data: RegistrationCreateWithSchedule,
    db: AsyncSession = Depends(get_db)
):
    """Enhanced registration endpoint with schedule validation."""
    registration_service = RegistrationService()
    notification_service = NotificationService()
    payment_service = PaymentService()

    try:
        registration = await registration_service.create_registration_with_schedule(
            data.model_dump(), db
        )

        if registration.status == "pending_payment":
            # Get the yoga class for payment creation
            class_query = select(YogaClass).where(YogaClass.id == data.class_id)
            class_result = await db.execute(class_query)
            yoga_class = class_result.scalar_one()

            # Create payment record
            payment = await payment_service.create_payment_for_registration(
                registration, yoga_class, db,
                package_id=data.package_id,
                payment_method=data.payment_method
            )

            # Send payment instructions email instead of confirmation
            if registration.email_notifications:
                await notification_service.send_payment_pending_email(registration, payment, db)

            # Refresh to include payment relationship
            await db.refresh(registration, ["payment"])
        else:
            # Free class — existing flow
            if registration.email_notifications:
                await notification_service.send_confirmation_email(registration, db)

        # Schedule reminder if notifications are enabled
        if registration.email_notifications or registration.sms_notifications:
            await notification_service.schedule_reminder(registration)

        return registration
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/classes/{class_id}/available-dates", response_model=List[AvailableDateOut])
async def get_available_dates(
    class_id: uuid.UUID,
    from_date: date = Query(default_factory=date.today),
    limit: int = Query(default=10, ge=1, le=30),
    db: AsyncSession = Depends(get_db)
):
    """Get upcoming available dates for a class."""
    # Get the yoga class
    class_query = select(YogaClass).where(YogaClass.id == class_id)
    result = await db.execute(class_query)
    yoga_class = result.scalar_one_or_none()

    if not yoga_class:
        raise HTTPException(status_code=404, detail="Class not found")

    # Get or ensure schedule data exists
    registration_service = RegistrationService()
    schedule_data = await registration_service.ensure_schedule_data_exists(class_id, db)

    if not schedule_data:
        raise HTTPException(status_code=400, detail="Unable to parse class schedule")

    # Get available dates
    schedule_parser = ScheduleParserService()
    available_datetimes = schedule_parser.get_next_available_dates(
        schedule_data, from_date, limit
    )

    # Format response with capacity information
    available_dates = []
    for dt in available_datetimes:
        # Check capacity for this date
        is_available, current_count = await registration_service.validate_registration_capacity(
            class_id, dt.date(), db
        )

        available_spots = max(0, yoga_class.capacity - current_count)

        available_dates.append(AvailableDateOut(
            date_time=dt,
            formatted_date=dt.strftime("%A, %B %d, %Y"),
            formatted_time=dt.strftime("%-I:%M %p"),
            available_spots=available_spots
        ))

    return available_dates


@router.get("/classes/{class_id}/date/{target_date}", response_model=List[RegistrationOutWithSchedule])
async def get_registrations_for_date(
    class_id: uuid.UUID,
    target_date: date,
    db: AsyncSession = Depends(get_db)
):
    """Get all registrations for a specific class and date."""
    registration_service = RegistrationService()
    registrations = await registration_service.get_registrations_for_class_date(
        class_id, target_date, db
    )
    return registrations
