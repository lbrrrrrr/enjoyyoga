import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.yoga_type import YogaType
from app.schemas.yoga_type import YogaTypeOut

router = APIRouter(prefix="/api/yoga-types", tags=["yoga-types"])


@router.get("", response_model=list[YogaTypeOut])
async def list_yoga_types(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(YogaType))
    return result.scalars().all()


@router.get("/{yoga_type_id}", response_model=YogaTypeOut)
async def get_yoga_type(yoga_type_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(YogaType).where(YogaType.id == yoga_type_id))
    yoga_type = result.scalar_one_or_none()
    if not yoga_type:
        raise HTTPException(status_code=404, detail="Yoga type not found")
    return yoga_type
