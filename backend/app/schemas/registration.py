import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


class RegistrationCreate(BaseModel):
    class_id: uuid.UUID
    name: str
    email: str
    phone: str | None = None
    message: str | None = None


class RegistrationOut(BaseModel):
    id: uuid.UUID
    class_id: uuid.UUID
    name: str
    email: str
    phone: str | None
    message: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
