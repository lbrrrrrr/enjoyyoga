"""Test configuration and fixtures."""
import asyncio
import uuid
from datetime import date, datetime, time, timedelta
from typing import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport
from sqlalchemy import StaticPool
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.database import get_db
from app.models.yoga_type import Base
from app.main import app
from app.models.admin_user import AdminUser
from app.models.notification_template import NotificationTemplate
from app.models.registration import Registration
from app.models.teacher import Teacher
from app.models.yoga_class import YogaClass
from app.models.yoga_type import YogaType


# Test database URL (in-memory SQLite for speed)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def db_engine():
    """Create test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create test database session."""
    async_session = async_sessionmaker(
        db_engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create test HTTP client with dependency overrides."""
    app.dependency_overrides[get_db] = lambda: db_session

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def sample_yoga_type():
    """Sample yoga type for testing."""
    return {
        "id": uuid.uuid4(),
        "name_en": "Hatha Yoga",
        "name_zh": "哈他瑜伽",
        "description_en": "Gentle yoga practice",
        "description_zh": "温和的瑜伽练习",
        "image_url": "https://example.com/hatha.jpg",
    }


@pytest.fixture
def sample_teacher():
    """Sample teacher for testing."""
    return {
        "id": uuid.uuid4(),
        "name_en": "Jane Smith",
        "name_zh": "简·史密斯",
        "bio_en": "Experienced yoga instructor",
        "bio_zh": "经验丰富的瑜伽老师",
        "qualifications": "RYT 500",
        "photo_url": "https://example.com/jane.jpg",
    }


@pytest.fixture
def sample_yoga_class():
    """Sample yoga class for testing."""
    return {
        "id": uuid.uuid4(),
        "name_en": "Morning Hatha",
        "name_zh": "晨间哈他瑜伽",
        "description_en": "Gentle morning practice",
        "description_zh": "温和的晨间练习",
        "schedule": "Mon/Wed/Fri 7:00 AM",
        "schedule_type": "recurring",
        "capacity": 15,
        "duration_minutes": 60,
        "difficulty": "beginner",
        "is_active": True,
    }


@pytest.fixture
def sample_registration():
    """Sample registration for testing."""
    return {
        "id": uuid.uuid4(),
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "message": "Looking forward to the class!",
        "target_date": date(2024, 3, 15),  # A Monday
        "target_time": time(7, 0),
        "status": "confirmed",
        "preferred_language": "en",
        "email_notifications": True,
        "sms_notifications": False,
        "email_confirmation_sent": False,
        "reminder_sent": False,
    }


@pytest.fixture
def sample_admin_user():
    """Sample admin user for testing."""
    return {
        "id": uuid.uuid4(),
        "username": "admin",
        "email": "admin@example.com",
        "hashed_password": "hashed_password_123",
        "role": "admin",
        "is_active": True,
    }


@pytest.fixture
def sample_notification_template():
    """Sample notification template for testing."""
    import json
    return {
        "id": uuid.uuid4(),
        "template_type": "registration_confirmation",
        "channel": "email",
        "subject_en": "Registration Confirmation",
        "subject_zh": "注册确认",
        "content_en": "Dear {name}, your registration for {class_name} is confirmed.",
        "content_zh": "亲爱的 {name}，您对 {class_name} 的注册已确认。",
        "variables": json.dumps(["name", "class_name", "date", "time"]),
        "is_active": True,
    }


@pytest_asyncio.fixture
async def yoga_type_in_db(db_session: AsyncSession, sample_yoga_type):
    """Create yoga type in test database."""
    yoga_type = YogaType(**sample_yoga_type)
    db_session.add(yoga_type)
    await db_session.commit()
    await db_session.refresh(yoga_type)
    return yoga_type


@pytest_asyncio.fixture
async def teacher_in_db(db_session: AsyncSession, sample_teacher):
    """Create teacher in test database."""
    teacher = Teacher(**sample_teacher)
    db_session.add(teacher)
    await db_session.commit()
    await db_session.refresh(teacher)
    return teacher


@pytest_asyncio.fixture
async def yoga_class_in_db(
    db_session: AsyncSession,
    sample_yoga_class,
    teacher_in_db: Teacher,
    yoga_type_in_db: YogaType
):
    """Create yoga class in test database."""
    class_data = sample_yoga_class.copy()
    class_data["teacher_id"] = teacher_in_db.id
    class_data["yoga_type_id"] = yoga_type_in_db.id

    yoga_class = YogaClass(**class_data)
    db_session.add(yoga_class)
    await db_session.commit()
    await db_session.refresh(yoga_class)
    return yoga_class


@pytest_asyncio.fixture
async def registration_in_db(
    db_session: AsyncSession,
    sample_registration,
    yoga_class_in_db: YogaClass
):
    """Create registration in test database."""
    registration_data = sample_registration.copy()
    registration_data["class_id"] = yoga_class_in_db.id

    registration = Registration(**registration_data)
    db_session.add(registration)
    await db_session.commit()
    await db_session.refresh(registration)
    return registration


@pytest_asyncio.fixture
async def admin_user_in_db(db_session: AsyncSession, sample_admin_user):
    """Create admin user in test database."""
    admin_user = AdminUser(**sample_admin_user)
    db_session.add(admin_user)
    await db_session.commit()
    await db_session.refresh(admin_user)
    return admin_user


@pytest_asyncio.fixture
async def notification_template_in_db(db_session: AsyncSession, sample_notification_template):
    """Create notification template in test database."""
    template = NotificationTemplate(**sample_notification_template)
    db_session.add(template)
    await db_session.commit()
    await db_session.refresh(template)
    return template


# Mock settings for testing
@pytest.fixture
def mock_settings(mocker):
    """Mock application settings for testing."""
    from app.config import Settings
    test_settings = Settings(
        database_url="sqlite+aiosqlite:///:memory:",
        jwt_secret_key="test-secret-key",
        jwt_access_token_expire_minutes=1440,
        smtp_host="",  # Force console output in tests
        smtp_port=587,
        smtp_username="",
        smtp_password="",
        smtp_from_email="test@example.com",
        smtp_use_tls=False,
    )

    mocker.patch("app.config.settings", test_settings)
    return test_settings


# Sample schedule data for testing
@pytest.fixture
def sample_schedule_strings():
    """Sample schedule strings for testing."""
    return {
        "simple_recurring": "Mon/Wed/Fri 7:00 AM",
        "complex_recurring": "Monday, Wednesday, Friday at 7:00 AM",
        "single_day": "Monday 7:00 AM",
        "multiple_times": "Mon 7:00 AM, Wed 6:00 PM, Fri 7:00 AM",
        "with_pm": "Tue/Thu 6:30 PM",
        "invalid_format": "Every other Tuesday maybe",
        "empty_string": "",
        "twelve_hour_format": "Mon/Wed/Fri 07:00 AM",
        "twenty_four_hour": "Mon/Wed/Fri 19:00",
    }


@pytest.fixture
def sample_schedule_data():
    """Sample parsed schedule data for testing."""
    return {
        "type": "weekly_recurring",
        "pattern": {
            "days": ["monday", "wednesday", "friday"],
            "time": "07:00",
            "duration_minutes": 60,
            "timezone": "America/New_York"
        },
        "date_range": {
            "start_date": "2026-02-01",
            "end_date": None,
        },
        "exceptions": []
    }


# Timezone fixtures for testing
@pytest.fixture
def utc_dates():
    """UTC datetime fixtures for testing."""
    return {
        "monday": datetime(2024, 3, 11, 7, 0),  # Monday
        "tuesday": datetime(2024, 3, 12, 7, 0),  # Tuesday
        "wednesday": datetime(2024, 3, 13, 7, 0),  # Wednesday
        "thursday": datetime(2024, 3, 14, 7, 0),  # Thursday
        "friday": datetime(2024, 3, 15, 7, 0),  # Friday
        "saturday": datetime(2024, 3, 16, 7, 0),  # Saturday
        "sunday": datetime(2024, 3, 17, 7, 0),  # Sunday
    }


# JWT token fixtures
@pytest.fixture
def valid_jwt_token():
    """Valid JWT token for testing."""
    from app.auth import create_access_token
    return create_access_token({"sub": "admin"})


@pytest.fixture
def expired_jwt_token():
    """Expired JWT token for testing."""
    from app.auth import create_access_token
    return create_access_token(
        {"sub": "admin"},
        expires_delta=timedelta(seconds=-1)
    )


@pytest.fixture
def invalid_jwt_token():
    """Invalid JWT token for testing."""
    return "invalid.jwt.token"