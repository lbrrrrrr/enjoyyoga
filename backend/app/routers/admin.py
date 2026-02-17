import uuid
import json
from datetime import timedelta
from typing import List
from pathlib import Path
import shutil
import json
import base64
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.auth import authenticate_admin, create_access_token, get_current_admin
from app.config import settings
from app.services.schedule_parser import ScheduleParserService
from app.services.payment_service import PaymentService
from app.models.admin_user import AdminUser
from app.models.registration import Registration
from app.models.teacher import Teacher
from app.models.yoga_class import YogaClass
from app.models.yoga_type import YogaType
from app.schemas.admin import (
    AdminLoginSchema,
    AdminTokenOut,
    AdminUserOut,
    RegistrationStatusUpdate,
    AdminStatsOut
)
from app.schemas.registration import RegistrationOutWithSchedule
from app.schemas.teacher import TeacherOut, TeacherUpdate
from app.schemas.yoga_class import YogaClassOut, YogaClassCreate
from app.schemas.yoga_type import YogaTypeOut, YogaTypeCreate, YogaTypeUpdate

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/login", response_model=AdminTokenOut)
async def admin_login(
    credentials: AdminLoginSchema,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate admin user and set session cookies."""
    admin = await authenticate_admin(db, credentials.username, credentials.password)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=30)  # 30 minutes for session
    access_token = create_access_token(
        data={"sub": str(admin.id)}, expires_delta=access_token_expires
    )

    # Set session cookies
    # Use secure=False in development (HTTP), secure=True in production (HTTPS)
    is_production = settings.server_url.startswith("https://")

    response.set_cookie(
        key="admin_session",
        value=access_token,
        max_age=1800,  # 30 minutes in seconds
        httponly=True,
        secure=is_production,
        samesite="lax",  # Changed from "strict" to "lax" for development
        path="/"
    )

    # Create admin user data as JSON
    admin_user_data = {
        "id": str(admin.id),
        "username": admin.username,
        "email": admin.email,
        "role": admin.role
    }

    # Convert to JSON and encode as Base64 to avoid cookie character issues
    admin_user_json = json.dumps(admin_user_data)
    admin_user_base64 = base64.b64encode(admin_user_json.encode()).decode()


    response.set_cookie(
        key="admin_user",
        value=admin_user_base64,  # Use Base64 encoded JSON
        max_age=1800,  # 30 minutes in seconds
        httponly=False,  # Allow client-side access for user info
        secure=is_production,
        samesite="lax",  # Changed from "strict" to "lax" for development
        path="/"
    )

    return AdminTokenOut(
        access_token=access_token,
        token_type="bearer",
        admin=AdminUserOut.model_validate(admin)
    )


@router.post("/logout")
async def admin_logout(response: Response, admin: AdminUser = Depends(get_current_admin)):
    """Logout admin user and clear session cookies."""
    # Clear session cookies
    response.delete_cookie(key="admin_session", path="/")
    response.delete_cookie(key="admin_user", path="/")

    return {"message": "Successfully logged out"}


@router.get("/test-cookies")
async def test_cookies(request: Request):
    """Debug endpoint to check what cookies are being received."""
    cookies = request.cookies
    return {
        "message": "Cookie test endpoint",
        "cookies_received": dict(cookies),
        "admin_session": cookies.get("admin_session", "NOT FOUND"),
        "admin_user": cookies.get("admin_user", "NOT FOUND")
    }


@router.post("/test-login")
async def test_admin_login(response: Response):
    """Test endpoint to manually set cookies with known values."""
    # Create test admin user data
    admin_user_data = {
        "id": "test-id-123",
        "username": "test-admin",
        "email": "test@example.com",
        "role": "admin"
    }

    # Convert to JSON and encode as Base64
    admin_user_json = json.dumps(admin_user_data)
    admin_user_base64 = base64.b64encode(admin_user_json.encode()).decode()

    print(f"TEST: Original JSON: {admin_user_json}")
    print(f"TEST: Base64 encoded: {admin_user_base64}")

    # Set test cookies
    response.set_cookie(
        key="admin_user",
        value=admin_user_base64,
        max_age=1800,
        httponly=False,
        secure=False,  # Force false for testing
        samesite="lax",
        path="/"
    )

    return {
        "message": "Test cookies set",
        "original_json": admin_user_json,
        "base64_value": admin_user_base64
    }


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

    # Get payment stats
    payment_service = PaymentService()
    payment_stats = await payment_service.get_payment_stats(db)

    return AdminStatsOut(
        total_registrations=total_registrations_result.scalar(),
        total_teachers=total_teachers_result.scalar(),
        total_classes=total_classes_result.scalar(),
        recent_registrations=[
            RegistrationOutWithSchedule.model_validate(r) for r in recent_registrations
        ],
        pending_payments=payment_stats["pending_payments"],
        total_revenue=payment_stats["total_revenue"],
        total_revenue_cny=payment_stats["total_revenue_cny"],
        total_revenue_usd=payment_stats["total_revenue_usd"],
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
    valid_statuses = ["confirmed", "waitlist", "cancelled", "pending_payment"]
    if status_data.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )

    registration.status = status_data.status
    await db.commit()
    await db.refresh(registration)

    return RegistrationOutWithSchedule.model_validate(registration)


@router.post("/teachers", response_model=TeacherOut)
async def create_teacher(
    teacher_data: TeacherUpdate,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a new teacher."""
    teacher = Teacher(
        name_en=teacher_data.name_en,
        name_zh=teacher_data.name_zh,
        bio_en=teacher_data.bio_en,
        bio_zh=teacher_data.bio_zh,
        qualifications=teacher_data.qualifications,
        photo_url=teacher_data.photo_url
    )

    db.add(teacher)
    await db.commit()
    await db.refresh(teacher)

    return teacher


@router.put("/teachers/{teacher_id}", response_model=TeacherOut)
async def update_teacher(
    teacher_id: uuid.UUID,
    teacher_data: TeacherUpdate,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update teacher information."""
    query = select(Teacher).where(Teacher.id == teacher_id)
    result = await db.execute(query)
    teacher = result.scalar_one_or_none()

    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    # Update teacher fields
    teacher.name_en = teacher_data.name_en
    teacher.name_zh = teacher_data.name_zh
    teacher.bio_en = teacher_data.bio_en
    teacher.bio_zh = teacher_data.bio_zh
    teacher.qualifications = teacher_data.qualifications
    teacher.photo_url = teacher_data.photo_url

    await db.commit()
    await db.refresh(teacher)

    return TeacherOut.model_validate(teacher)


@router.post("/teachers/{teacher_id}/photo")
async def upload_teacher_photo(
    teacher_id: uuid.UUID,
    file: UploadFile = File(...),
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Upload a photo for a teacher."""
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=400,
            detail="File must be an image (jpg, png, gif, etc.)"
        )

    # Validate file size (5MB limit)
    max_size = 5 * 1024 * 1024  # 5MB
    if file.size and file.size > max_size:
        raise HTTPException(
            status_code=400,
            detail="File size must be less than 5MB"
        )

    # Check if teacher exists
    query = select(Teacher).where(Teacher.id == teacher_id)
    result = await db.execute(query)
    teacher = result.scalar_one_or_none()

    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    # Create upload directory
    upload_dir = Path("uploads/teachers")
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique filename
    file_extension = ""
    if file.filename and "." in file.filename:
        file_extension = file.filename.split('.')[-1]
    else:
        # Default extension based on content type
        if file.content_type == "image/jpeg":
            file_extension = "jpg"
        elif file.content_type == "image/png":
            file_extension = "png"
        elif file.content_type == "image/gif":
            file_extension = "gif"
        else:
            file_extension = "jpg"

    filename = f"{teacher_id}_{uuid.uuid4().hex}.{file_extension}"
    file_path = upload_dir / filename

    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Failed to save uploaded file"
        )
    finally:
        await file.close()

    # Update teacher record with new photo URL (use absolute URL)
    teacher.photo_url = f"{settings.server_url}/uploads/teachers/{filename}"
    await db.commit()
    await db.refresh(teacher)

    return {
        "message": "Photo uploaded successfully",
        "photo_url": teacher.photo_url,
        "teacher": TeacherOut.model_validate(teacher)
    }


@router.post("/classes", response_model=YogaClassOut)
async def create_class(
    class_data: YogaClassCreate,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a new yoga class."""
    # Verify teacher exists
    teacher_query = select(Teacher).where(Teacher.id == class_data.teacher_id)
    teacher_result = await db.execute(teacher_query)
    teacher = teacher_result.scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    # Verify yoga type exists
    yoga_type_query = select(YogaType).where(YogaType.id == class_data.yoga_type_id)
    yoga_type_result = await db.execute(yoga_type_query)
    yoga_type = yoga_type_result.scalar_one_or_none()
    if not yoga_type:
        raise HTTPException(status_code=404, detail="Yoga type not found")

    # Parse schedule string into structured data
    schedule_parser = ScheduleParserService()
    parsed_schedule = schedule_parser.parse_schedule_string(class_data.schedule)

    # Create the class
    yoga_class = YogaClass(
        name_en=class_data.name_en,
        name_zh=class_data.name_zh,
        description_en=class_data.description_en,
        description_zh=class_data.description_zh,
        teacher_id=class_data.teacher_id,
        yoga_type_id=class_data.yoga_type_id,
        schedule=class_data.schedule,
        schedule_data=json.dumps(parsed_schedule),  # Save structured schedule data
        duration_minutes=class_data.duration_minutes,
        difficulty=class_data.difficulty,
        capacity=class_data.capacity,
        location=class_data.location,
        schedule_type=class_data.schedule_type,
        is_active=class_data.is_active,
        price=class_data.price,
        price_usd=class_data.price_usd,
        currency=class_data.currency,
    )

    db.add(yoga_class)
    await db.commit()
    await db.refresh(yoga_class, ["teacher", "yoga_type", "packages"])

    return yoga_class


@router.put("/classes/{class_id}", response_model=YogaClassOut)
async def update_class(
    class_id: uuid.UUID,
    class_data: YogaClassCreate,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update an existing yoga class."""
    # Find the class
    query = select(YogaClass).where(YogaClass.id == class_id)
    result = await db.execute(query)
    yoga_class = result.scalar_one_or_none()

    if not yoga_class:
        raise HTTPException(status_code=404, detail="Class not found")

    # Verify teacher exists
    teacher_query = select(Teacher).where(Teacher.id == class_data.teacher_id)
    teacher_result = await db.execute(teacher_query)
    teacher = teacher_result.scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    # Verify yoga type exists
    yoga_type_query = select(YogaType).where(YogaType.id == class_data.yoga_type_id)
    yoga_type_result = await db.execute(yoga_type_query)
    yoga_type = yoga_type_result.scalar_one_or_none()
    if not yoga_type:
        raise HTTPException(status_code=404, detail="Yoga type not found")

    # Parse schedule string into structured data
    schedule_parser = ScheduleParserService()
    parsed_schedule = schedule_parser.parse_schedule_string(class_data.schedule)

    # Update class fields
    yoga_class.name_en = class_data.name_en
    yoga_class.name_zh = class_data.name_zh
    yoga_class.description_en = class_data.description_en
    yoga_class.description_zh = class_data.description_zh
    yoga_class.teacher_id = class_data.teacher_id
    yoga_class.yoga_type_id = class_data.yoga_type_id
    yoga_class.schedule = class_data.schedule
    yoga_class.schedule_data = json.dumps(parsed_schedule)  # Update structured schedule data
    yoga_class.duration_minutes = class_data.duration_minutes
    yoga_class.difficulty = class_data.difficulty
    yoga_class.capacity = class_data.capacity
    yoga_class.location = class_data.location
    yoga_class.schedule_type = class_data.schedule_type
    yoga_class.is_active = class_data.is_active
    yoga_class.price = class_data.price
    yoga_class.price_usd = class_data.price_usd
    yoga_class.currency = class_data.currency

    await db.commit()
    await db.refresh(yoga_class, ["teacher", "yoga_type", "packages"])

    return yoga_class


@router.post("/yoga-types", response_model=YogaTypeOut)
async def create_yoga_type(
    yoga_type_data: YogaTypeCreate,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a new yoga type."""
    yoga_type = YogaType(
        name_en=yoga_type_data.name_en,
        name_zh=yoga_type_data.name_zh,
        description_en=yoga_type_data.description_en,
        description_zh=yoga_type_data.description_zh,
        image_url=yoga_type_data.image_url
    )

    db.add(yoga_type)
    await db.commit()
    await db.refresh(yoga_type)

    return yoga_type


@router.put("/yoga-types/{yoga_type_id}", response_model=YogaTypeOut)
async def update_yoga_type(
    yoga_type_id: uuid.UUID,
    yoga_type_data: YogaTypeUpdate,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update yoga type information."""
    query = select(YogaType).where(YogaType.id == yoga_type_id)
    result = await db.execute(query)
    yoga_type = result.scalar_one_or_none()

    if not yoga_type:
        raise HTTPException(status_code=404, detail="Yoga type not found")

    # Update yoga type fields
    yoga_type.name_en = yoga_type_data.name_en
    yoga_type.name_zh = yoga_type_data.name_zh
    yoga_type.description_en = yoga_type_data.description_en
    yoga_type.description_zh = yoga_type_data.description_zh
    yoga_type.image_url = yoga_type_data.image_url

    await db.commit()
    await db.refresh(yoga_type)

    return yoga_type