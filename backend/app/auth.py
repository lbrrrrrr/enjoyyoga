from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from jose import JWTError, jwt
import hashlib
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.database import get_db
from app.models.admin_user import AdminUser

security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Temporary simple hash verification - TODO: Fix bcrypt integration
    simple_hash = hashlib.sha256(plain_password.encode()).hexdigest()
    return simple_hash == hashed_password


def get_password_hash(password: str) -> str:
    # Temporary simple hash - TODO: Fix bcrypt integration
    return hashlib.sha256(password.encode()).hexdigest()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.jwt_access_token_expire_minutes)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt


async def authenticate_admin(db: AsyncSession, username: str, password: str) -> Optional[AdminUser]:
    query = select(AdminUser).where(AdminUser.username == username, AdminUser.is_active == True)
    result = await db.execute(query)
    admin = result.scalar_one_or_none()

    if not admin:
        return None
    if not verify_password(password, admin.hashed_password):
        return None
    return admin


async def get_current_admin(token = Depends(security), db: AsyncSession = Depends(get_db)) -> AdminUser:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token.credentials, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        admin_id: str = payload.get("sub")
        if admin_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    query = select(AdminUser).where(AdminUser.id == admin_id, AdminUser.is_active == True)
    result = await db.execute(query)
    admin = result.scalar_one_or_none()

    if admin is None:
        raise credentials_exception
    return admin