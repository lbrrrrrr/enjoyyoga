import uuid
from datetime import timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.auth import authenticate_admin, create_access_token, get_current_admin
from app.models.admin_user import AdminUser
from app.models.registration import Registration
from app.models.teacher import Teacher
from app.models.yoga_class import YogaClass
from app.schemas.admin import (
    AdminLoginSchema,
    AdminTokenOut,
    AdminUserOut,
    RegistrationStatusUpdate,
    AdminStatsOut
)
from app.schemas.registration import RegistrationOutWithSchedule

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/login", response_model=AdminTokenOut)
async def admin_login(credentials: AdminLoginSchema, db: AsyncSession = Depends(get_db)):
    """Authenticate admin user and return JWT token."""
    admin = await authenticate_admin(db, credentials.username, credentials.password)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=1440)  # 24 hours
    access_token = create_access_token(
        data={"sub": str(admin.id)}, expires_delta=access_token_expires
    )

    return AdminTokenOut(
        access_token=access_token,
        token_type="bearer",
        admin=AdminUserOut.model_validate(admin)
    )


@router.get("/me", response_model=AdminUserOut)
async def get_current_admin_info(admin: AdminUser = Depends(get_current_admin)):
    """Get current admin user information."""
    return AdminUserOut.model_validate(admin)


@router.get("/dashboard/stats", response_model=AdminStatsOut)
async def get_dashboard_stats(
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get dashboard statistics."""
    # Get total counts
    total_registrations_query = select(func.count(Registration.id))
    total_teachers_query = select(func.count(Teacher.id))
    total_classes_query = select(func.count(YogaClass.id))

    total_registrations_result = await db.execute(total_registrations_query)
    total_teachers_result = await db.execute(total_teachers_query)
    total_classes_result = await db.execute(total_classes_query)

    # Get recent registrations (last 5)
    recent_registrations_query = (
        select(Registration)
        .order_by(Registration.created_at.desc())
        .limit(5)
    )
    recent_registrations_result = await db.execute(recent_registrations_query)
    recent_registrations = recent_registrations_result.scalars().all()

    return AdminStatsOut(
        total_registrations=total_registrations_result.scalar(),
        total_teachers=total_teachers_result.scalar(),
        total_classes=total_classes_result.scalar(),
        recent_registrations=[
            RegistrationOutWithSchedule.model_validate(r) for r in recent_registrations
        ]
    )


@router.get("/registrations", response_model=List[RegistrationOutWithSchedule])
async def list_registrations(
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get all registrations."""
    query = select(Registration).order_by(Registration.created_at.desc())
    result = await db.execute(query)
    registrations = result.scalars().all()

    return [RegistrationOutWithSchedule.model_validate(r) for r in registrations]


@router.get("/registrations/{registration_id}", response_model=RegistrationOutWithSchedule)
async def get_registration(
    registration_id: uuid.UUID,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific registration."""
    query = select(Registration).where(Registration.id == registration_id)
    result = await db.execute(query)
    registration = result.scalar_one_or_none()

    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")

    return RegistrationOutWithSchedule.model_validate(registration)


@router.put("/registrations/{registration_id}/status", response_model=RegistrationOutWithSchedule)
async def update_registration_status(
    registration_id: uuid.UUID,
    status_data: RegistrationStatusUpdate,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update registration status."""
    query = select(Registration).where(Registration.id == registration_id)
    result = await db.execute(query)
    registration = result.scalar_one_or_none()

    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")

    # Validate status
    valid_statuses = ["confirmed", "waitlist", "cancelled"]
    if status_data.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )

    registration.status = status_data.status
    await db.commit()
    await db.refresh(registration)

    return RegistrationOutWithSchedule.model_validate(registration)