from datetime import datetime, timedelta, timezone
from typing import Optional
import uuid

from fastapi import Depends, HTTPException, status, Request, Cookie
from fastapi.security import HTTPBearer
from fastapi.security.utils import get_authorization_scheme_param
import jwt
from jwt.exceptions import PyJWTError
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
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_access_token_expire_minutes)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)  # type: ignore[arg-type]
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


async def get_current_admin_bearer(token = Depends(security), db: AsyncSession = Depends(get_db)) -> AdminUser:
    """Legacy bearer token authentication - kept for backward compatibility"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Handle both string tokens (for testing) and HTTPBearer tokens (for production)
        token_str = token.credentials if hasattr(token, 'credentials') else token
        payload = jwt.decode(token_str, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        admin_id_str: str = payload.get("sub")
        if admin_id_str is None:
            raise credentials_exception

        # Convert string ID to UUID for database query
        try:
            admin_id = uuid.UUID(admin_id_str)
        except ValueError:
            raise credentials_exception
    except PyJWTError:
        raise credentials_exception

    query = select(AdminUser).where(AdminUser.id == admin_id, AdminUser.is_active == True)
    result = await db.execute(query)
    admin = result.scalar_one_or_none()

    if admin is None:
        raise credentials_exception
    return admin


async def get_current_admin(
    request: Request,
    admin_session: str = Cookie(None, alias="admin_session"),
    db: AsyncSession = Depends(get_db)
) -> AdminUser:
    """Hybrid authentication supporting both session cookies and Bearer tokens"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Try session cookie authentication first
    jwt_token = None
    if admin_session:
        jwt_token = admin_session
    else:
        # Fallback to Bearer token authentication
        authorization = request.headers.get("authorization")
        if authorization:
            scheme, token = get_authorization_scheme_param(authorization)
            if scheme.lower() == "bearer":
                jwt_token = token

    if not jwt_token:
        raise credentials_exception

    try:
        payload = jwt.decode(jwt_token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        admin_id_str: str = payload.get("sub")
        if admin_id_str is None:
            raise credentials_exception

        # Convert string ID to UUID for database query
        try:
            admin_id = uuid.UUID(admin_id_str)
        except ValueError:
            raise credentials_exception
    except PyJWTError:
        raise credentials_exception

    query = select(AdminUser).where(AdminUser.id == admin_id, AdminUser.is_active == True)
    result = await db.execute(query)
    admin = result.scalar_one_or_none()

    if admin is None:
        raise credentials_exception
    return admin