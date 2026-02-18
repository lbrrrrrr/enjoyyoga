import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth import get_current_admin
from app.models.admin_user import AdminUser
from app.schemas.consent import (
    ConsentCreate,
    ConsentOut,
    ConsentCheckResult,
    ConsentListItem,
)
from app.services.consent_service import ConsentService

# Public router for consent operations
router = APIRouter(prefix="/api/consent", tags=["consent"])

# Admin router for managing consent records
admin_router = APIRouter(prefix="/api/admin/consent", tags=["admin-consent"])


@router.get("/check", response_model=ConsentCheckResult)
async def check_consent(
    email: str = Query(...),
    yoga_type_id: uuid.UUID = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Check if a consent record exists for the given email and yoga type."""
    consent_service = ConsentService()
    record = await consent_service.check_consent(email, yoga_type_id, db)
    if record:
        return ConsentCheckResult(has_consent=True, consent=ConsentOut.model_validate(record))
    return ConsentCheckResult(has_consent=False)


@router.post("/sign", response_model=ConsentOut, status_code=201)
async def sign_consent(
    consent_data: ConsentCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Sign a consent waiver. Idempotent — returns existing record if already signed."""
    consent_service = ConsentService()
    ip_address = request.client.host if request.client else None
    record = await consent_service.create_consent(consent_data, db, ip_address=ip_address)
    return record


@admin_router.get("/consents", response_model=List[ConsentListItem])
async def list_consents(
    email: Optional[str] = Query(None),
    yoga_type_id: Optional[uuid.UUID] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    """List all consent records with optional filtering (admin only)."""
    consent_service = ConsentService()
    records = await consent_service.get_all_consents(
        db, email=email, yoga_type_id=yoga_type_id, limit=limit, offset=offset
    )
    items = []
    for r in records:
        item = ConsentListItem(
            id=r.id,
            email=r.email,
            name=r.name,
            yoga_type_id=r.yoga_type_id,
            yoga_type_name_en=r.yoga_type.name_en if r.yoga_type else None,
            yoga_type_name_zh=r.yoga_type.name_zh if r.yoga_type else None,
            consent_text_version=r.consent_text_version,
            signed_at=r.signed_at,
        )
        items.append(item)
    return items


@admin_router.get("/stats")
async def get_consent_stats(
    db: AsyncSession = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    """Get consent statistics for admin dashboard."""
    consent_service = ConsentService()
    return await consent_service.get_consent_stats(db)
