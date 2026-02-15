import uuid
from datetime import datetime

from pydantic import BaseModel


class TeacherUpdate(BaseModel):
    name_en: str
    name_zh: str
    bio_en: str
    bio_zh: str
    qualifications: str
    photo_url: str | None = None


class TeacherOut(BaseModel):
    id: uuid.UUID
    name_en: str
    name_zh: str
    bio_en: str
    bio_zh: str
    qualifications: str
    photo_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
