import uuid
from datetime import datetime

from pydantic import BaseModel


class YogaTypeCreate(BaseModel):
    name_en: str
    name_zh: str
    description_en: str = ""
    description_zh: str = ""
    image_url: str | None = None


class YogaTypeUpdate(BaseModel):
    name_en: str
    name_zh: str
    description_en: str = ""
    description_zh: str = ""
    image_url: str | None = None


class YogaTypeOut(BaseModel):
    id: uuid.UUID
    name_en: str
    name_zh: str
    description_en: str
    description_zh: str
    image_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
