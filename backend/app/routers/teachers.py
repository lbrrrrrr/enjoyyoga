import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.teacher import Teacher
from app.schemas.teacher import TeacherOut

router = APIRouter(prefix="/api/teachers", tags=["teachers"])


@router.get("", response_model=list[TeacherOut])
async def list_teachers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Teacher))
    return result.scalars().all()


@router.get("/{teacher_id}", response_model=TeacherOut)
async def get_teacher(teacher_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Teacher).where(Teacher.id == teacher_id))
    teacher = result.scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher
