from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.registration import Registration
from app.schemas.registration import RegistrationCreate, RegistrationOut

router = APIRouter(prefix="/api/registrations", tags=["registrations"])


@router.post("", response_model=RegistrationOut, status_code=201)
async def create_registration(data: RegistrationCreate, db: AsyncSession = Depends(get_db)):
    registration = Registration(**data.model_dump())
    db.add(registration)
    await db.commit()
    await db.refresh(registration)
    return registration
