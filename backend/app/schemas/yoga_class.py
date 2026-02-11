import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.teacher import TeacherOut
from app.schemas.yoga_type import YogaTypeOut


class YogaClassOut(BaseModel):
    id: uuid.UUID
    name_en: str
    name_zh: str
    description_en: str
    description_zh: str
    teacher_id: uuid.UUID
    yoga_type_id: uuid.UUID
    schedule: str
    duration_minutes: int
    difficulty: str
    capacity: int
    created_at: datetime
    teacher: TeacherOut
    yoga_type: YogaTypeOut

    model_config = {"from_attributes": True}
