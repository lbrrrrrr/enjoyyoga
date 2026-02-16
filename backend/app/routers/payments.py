import uuid
import shutil
from typing import List, Optional
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth import get_current_admin
from app.config import settings
from app.models.admin_user import AdminUser
from app.services.payment_service import PaymentService
from app.schemas.payment import (
    PaymentOut,
    PaymentConfirm,
    PaymentReject,
    PaymentSettingsOut,
    PaymentSettingsUpdate,
    PaymentInfoOut,
    PaymentStatsOut,
    ClassPackageCreate,
    ClassPackageUpdate,
    ClassPackageOut,
)

# Public router
router = APIRouter(prefix="/api/payments", tags=["payments"])

# Admin router
admin_router = APIRouter(prefix="/api/admin", tags=["admin-payments"])


# ---- Public endpoints ----

@router.get("/status/{reference_number}", response_model=PaymentInfoOut)
async def get_payment_status(reference_number: str, db: AsyncSession = Depends(get_db)):
    """Get payment status by reference number (public)."""
    payment_service = PaymentService()
    payment = await payment_service.get_payment_by_reference(reference_number, db)

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    # Get payment settings for QR code and instructions
    payment_settings = await payment_service.get_payment_settings(db)

    return PaymentInfoOut(
        payment_id=payment.id,
        reference_number=payment.reference_number,
        amount=float(payment.amount),
        currency=payment.currency,
        status=payment.status,
        payment_method=payment.payment_method,
        wechat_qr_code_url=payment_settings.wechat_qr_code_url if payment_settings else None,
        payment_instructions_en=payment_settings.payment_instructions_en if payment_settings else None,
        payment_instructions_zh=payment_settings.payment_instructions_zh if payment_settings else None,
        venmo_qr_code_url=payment_settings.venmo_qr_code_url if payment_settings else None,
        venmo_payment_instructions_en=payment_settings.venmo_payment_instructions_en if payment_settings else None,
        venmo_payment_instructions_zh=payment_settings.venmo_payment_instructions_zh if payment_settings else None,
        created_at=payment.created_at,
    )


@router.get("/settings", response_model=PaymentSettingsOut)
async def get_payment_settings_public(db: AsyncSession = Depends(get_db)):
    """Get payment settings (public - QR code URL and instructions)."""
    payment_service = PaymentService()
    payment_settings = await payment_service.get_payment_settings(db)

    if not payment_settings:
        raise HTTPException(status_code=404, detail="Payment settings not configured")

    return payment_settings


@router.get("/registration/{registration_id}", response_model=PaymentInfoOut)
async def get_payment_by_registration(registration_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Get payment info by registration ID (public)."""
    payment_service = PaymentService()
    payment = await payment_service.get_payment_by_registration(registration_id, db)

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found for this registration")

    payment_settings = await payment_service.get_payment_settings(db)

    return PaymentInfoOut(
        payment_id=payment.id,
        reference_number=payment.reference_number,
        amount=float(payment.amount),
        currency=payment.currency,
        status=payment.status,
        payment_method=payment.payment_method,
        wechat_qr_code_url=payment_settings.wechat_qr_code_url if payment_settings else None,
        payment_instructions_en=payment_settings.payment_instructions_en if payment_settings else None,
        payment_instructions_zh=payment_settings.payment_instructions_zh if payment_settings else None,
        venmo_qr_code_url=payment_settings.venmo_qr_code_url if payment_settings else None,
        venmo_payment_instructions_en=payment_settings.venmo_payment_instructions_en if payment_settings else None,
        venmo_payment_instructions_zh=payment_settings.venmo_payment_instructions_zh if payment_settings else None,
        created_at=payment.created_at,
    )


# ---- Admin endpoints ----

@admin_router.get("/payments", response_model=List[PaymentOut])
async def list_payments(
    status: Optional[str] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all payments with optional status filter."""
    payment_service = PaymentService()
    payments = await payment_service.get_all_payments(db, status=status, limit=limit, offset=offset)
    return [PaymentOut.model_validate(p) for p in payments]


@admin_router.get("/payments/pending", response_model=List[PaymentOut])
async def list_pending_payments(
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """List pending payments only."""
    payment_service = PaymentService()
    payments = await payment_service.get_pending_payments(db)
    return [PaymentOut.model_validate(p) for p in payments]


@admin_router.get("/payments/stats", response_model=PaymentStatsOut)
async def get_payment_stats(
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get payment statistics."""
    payment_service = PaymentService()
    stats = await payment_service.get_payment_stats(db)
    return PaymentStatsOut(**stats)


@admin_router.get("/payments/{payment_id}", response_model=PaymentOut)
async def get_payment_detail(
    payment_id: uuid.UUID,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific payment."""
    payment_service = PaymentService()
    payment = await payment_service.get_payment_by_id(payment_id, db)

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    return PaymentOut.model_validate(payment)


@admin_router.post("/payments/{payment_id}/confirm", response_model=PaymentOut)
async def confirm_payment(
    payment_id: uuid.UUID,
    data: PaymentConfirm,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Confirm a payment and update the associated registration."""
    payment_service = PaymentService()

    try:
        payment = await payment_service.confirm_payment(
            payment_id, admin.id, db, notes=data.admin_notes
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # Send payment confirmed email
    from app.services.notification_service import NotificationService
    from app.models.registration import Registration
    from sqlalchemy import select

    notification_service = NotificationService()
    if payment.registration_id:
        reg_query = select(Registration).where(Registration.id == payment.registration_id)
        reg_result = await db.execute(reg_query)
        registration = reg_result.scalar_one_or_none()
        if registration and registration.email_notifications:
            await notification_service.send_payment_confirmed_email(registration, payment, db)

    return PaymentOut.model_validate(payment)


@admin_router.post("/payments/{payment_id}/cancel", response_model=PaymentOut)
async def cancel_payment(
    payment_id: uuid.UUID,
    data: PaymentReject,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Cancel a payment and update the associated registration."""
    payment_service = PaymentService()

    try:
        payment = await payment_service.cancel_payment(payment_id, db, notes=data.admin_notes)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return PaymentOut.model_validate(payment)


# ---- Package endpoints ----

@admin_router.get("/packages/{class_id}", response_model=List[ClassPackageOut])
async def list_packages(
    class_id: uuid.UUID,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """List packages for a class."""
    payment_service = PaymentService()
    packages = await payment_service.get_packages_for_class(class_id, db)
    return [ClassPackageOut.model_validate(p) for p in packages]


@admin_router.post("/packages", response_model=ClassPackageOut, status_code=201)
async def create_package(
    data: ClassPackageCreate,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new class package."""
    payment_service = PaymentService()
    package = await payment_service.create_package(data, db)
    return ClassPackageOut.model_validate(package)


@admin_router.put("/packages/{package_id}", response_model=ClassPackageOut)
async def update_package(
    package_id: uuid.UUID,
    data: ClassPackageUpdate,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update a class package."""
    payment_service = PaymentService()
    package = await payment_service.update_package(package_id, data, db)

    if not package:
        raise HTTPException(status_code=404, detail="Package not found")

    return ClassPackageOut.model_validate(package)


# ---- Payment Settings endpoints ----

@admin_router.get("/payment-settings", response_model=PaymentSettingsOut)
async def get_payment_settings_admin(
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get payment settings (admin)."""
    payment_service = PaymentService()
    payment_settings = await payment_service.get_payment_settings(db)

    if not payment_settings:
        # Create default settings
        payment_settings = await payment_service.update_payment_settings(db)

    return payment_settings


@admin_router.put("/payment-settings", response_model=PaymentSettingsOut)
async def update_payment_settings(
    data: PaymentSettingsUpdate,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update payment settings (instructions text)."""
    payment_service = PaymentService()
    payment_settings = await payment_service.update_payment_settings(
        db,
        payment_instructions_en=data.payment_instructions_en,
        payment_instructions_zh=data.payment_instructions_zh,
        venmo_payment_instructions_en=data.venmo_payment_instructions_en,
        venmo_payment_instructions_zh=data.venmo_payment_instructions_zh,
    )
    return payment_settings


@admin_router.post("/payment-settings/qr-code")
async def upload_qr_code(
    file: UploadFile = File(...),
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Upload WeChat QR code image."""
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image (jpg, png, gif, etc.)")

    # Validate file size (5MB limit)
    max_size = 5 * 1024 * 1024
    if file.size and file.size > max_size:
        raise HTTPException(status_code=400, detail="File size must be less than 5MB")

    # Create upload directory
    upload_dir = Path("uploads/payment")
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Generate filename
    file_extension = "jpg"
    if file.filename and "." in file.filename:
        file_extension = file.filename.split(".")[-1]
    elif file.content_type == "image/png":
        file_extension = "png"

    filename = f"wechat_qr_{uuid.uuid4().hex}.{file_extension}"
    file_path = upload_dir / filename

    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to save uploaded file")
    finally:
        await file.close()

    # Update payment settings with QR code URL
    qr_code_url = f"{settings.server_url}/uploads/payment/{filename}"
    payment_service = PaymentService()
    payment_settings = await payment_service.update_payment_settings(
        db, wechat_qr_code_url=qr_code_url
    )

    return {
        "message": "QR code uploaded successfully",
        "qr_code_url": qr_code_url,
        "settings": PaymentSettingsOut.model_validate(payment_settings),
    }


@admin_router.post("/payment-settings/venmo-qr-code")
async def upload_venmo_qr_code(
    file: UploadFile = File(...),
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Upload Venmo QR code image."""
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image (jpg, png, gif, etc.)")

    # Validate file size (5MB limit)
    max_size = 5 * 1024 * 1024
    if file.size and file.size > max_size:
        raise HTTPException(status_code=400, detail="File size must be less than 5MB")

    # Create upload directory
    upload_dir = Path("uploads/payment")
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Generate filename
    file_extension = "jpg"
    if file.filename and "." in file.filename:
        file_extension = file.filename.split(".")[-1]
    elif file.content_type == "image/png":
        file_extension = "png"

    filename = f"venmo_qr_{uuid.uuid4().hex}.{file_extension}"
    file_path = upload_dir / filename

    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to save uploaded file")
    finally:
        await file.close()

    # Update payment settings with Venmo QR code URL
    qr_code_url = f"{settings.server_url}/uploads/payment/{filename}"
    payment_service = PaymentService()
    payment_settings = await payment_service.update_payment_settings(
        db, venmo_qr_code_url=qr_code_url
    )

    return {
        "message": "Venmo QR code uploaded successfully",
        "qr_code_url": qr_code_url,
        "settings": PaymentSettingsOut.model_validate(payment_settings),
    }
