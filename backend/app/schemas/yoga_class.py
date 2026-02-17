import re
import uuid
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, field_validator

from app.schemas.teacher import TeacherOut
from app.schemas.yoga_type import YogaTypeOut
from app.schemas.payment import ClassPackageOut
from app.services.schedule_parser import ScheduleParserService

_CANONICAL_RE = re.compile(
    r'^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun))* \d{1,2}:\d{2} (AM|PM)$'
)


class YogaClassCreate(BaseModel):
    name_en: str
    name_zh: str
    description_en: str = ""
    description_zh: str = ""
    teacher_id: uuid.UUID
    yoga_type_id: uuid.UUID
    schedule: str
    duration_minutes: int
    difficulty: str
    capacity: int
    schedule_type: str = "recurring"
    is_active: bool = True
    price: Optional[float] = None
    price_usd: Optional[float] = None
    currency: str = "CNY"

    @field_validator("schedule")
    @classmethod
    def validate_schedule(cls, v: str) -> str:
        normalized = ScheduleParserService.normalize_schedule(v)
        if not _CANONICAL_RE.match(normalized):
            raise ValueError(
                'Invalid schedule format. Expected: "Mon/Wed/Fri 7:00 AM" '
                "(3-letter day abbreviations separated by /, time in 12-hour AM/PM format)"
            )
        return normalized


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
    price: Optional[float] = None
    price_usd: Optional[float] = None
    currency: str = "CNY"
    teacher: TeacherOut
    yoga_type: YogaTypeOut
    packages: List[ClassPackageOut] = []

    model_config = {"from_attributes": True}
