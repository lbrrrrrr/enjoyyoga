import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.yoga_class import YogaClass
from app.schemas.yoga_class import YogaClassOut

router = APIRouter(prefix="/api/classes", tags=["classes"])


@router.get("", response_model=list[YogaClassOut])
async def list_classes(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(YogaClass)
        .options(selectinload(YogaClass.teacher), selectinload(YogaClass.yoga_type), selectinload(YogaClass.packages))
    )
    return result.scalars().all()


@router.get("/teacher/{teacher_id}", response_model=list[YogaClassOut])
async def get_classes_by_teacher(teacher_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(YogaClass)
        .where(YogaClass.teacher_id == teacher_id)
        .options(selectinload(YogaClass.teacher), selectinload(YogaClass.yoga_type), selectinload(YogaClass.packages))
        .order_by(YogaClass.name_en)
    )
    return result.scalars().all()


@router.get("/{class_id}", response_model=YogaClassOut)
async def get_class(class_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(YogaClass)
        .where(YogaClass.id == class_id)
        .options(selectinload(YogaClass.teacher), selectinload(YogaClass.yoga_type), selectinload(YogaClass.packages))
    )
    yoga_class = result.scalar_one_or_none()
    if not yoga_class:
        raise HTTPException(status_code=404, detail="Class not found")
    return yoga_class
