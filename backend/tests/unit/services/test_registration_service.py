"""Unit tests for RegistrationService."""
import json
import uuid
from datetime import date, time
from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.registration import Registration
from app.models.yoga_class import YogaClass
from app.services.registration_service import RegistrationService


class TestRegistrationService:
    """Test cases for RegistrationService."""

    @pytest.mark.unit
    async def test_create_registration_with_schedule_success(
        self,
        db_session: AsyncSession,
        yoga_class_in_db: YogaClass,
    ):
        """Test successful registration creation with schedule validation."""
        # Set up schedule data on the class
        schedule_data = {
            "type": "recurring",
            "pattern": {
                "days": ["monday", "wednesday", "friday"],
                "time": "07:00",
            },
            "date_range": {"start_date": None, "end_date": None},
            "exceptions": [],
            "timezone": "UTC",
            "original_schedule": "Mon/Wed/Fri 7:00 AM",
        }
        yoga_class_in_db.schedule_data = json.dumps(schedule_data)
        await db_session.commit()

        registration_data = {
            "name": "John Doe",
            "email": "john@example.com",
            "phone": "+1234567890",
            "class_id": yoga_class_in_db.id,
            "target_date": date(2024, 3, 11),  # Monday
            "target_time": time(7, 0),
            "preferred_language": "en",
            "email_notifications": True,
        }

        service = RegistrationService()
        result = await service.create_registration_with_schedule(
            registration_data, db_session
        )

        assert result is not None
        assert result.name == "John Doe"
        assert result.email == "john@example.com"
        assert result.class_id == yoga_class_in_db.id
        assert result.status == "confirmed"

    @pytest.mark.unit
    async def test_create_registration_with_invalid_date(
        self,
        db_session: AsyncSession,
        yoga_class_in_db: YogaClass,
    ):
        """Test registration creation with invalid target date."""
        # Set up schedule data
        schedule_data = {
            "type": "recurring",
            "pattern": {
                "days": ["monday", "wednesday", "friday"],
                "time": "07:00",
            },
            "date_range": {"start_date": None, "end_date": None},
            "exceptions": [],
            "timezone": "UTC",
            "original_schedule": "Mon/Wed/Fri 7:00 AM",
        }
        yoga_class_in_db.schedule_data = json.dumps(schedule_data)
        await db_session.commit()

        registration_data = {
            "name": "John Doe",
            "email": "john@example.com",
            "class_id": yoga_class_in_db.id,
            "target_date": date(2024, 3, 12),  # Tuesday (not valid)
            "target_time": time(7, 0),
            "preferred_language": "en",
        }

        service = RegistrationService()

        with pytest.raises(ValueError) as exc_info:
            await service.create_registration_with_schedule(
                registration_data, db_session
            )

        assert "not available on this date" in str(exc_info.value)
        assert "Available dates" in str(exc_info.value)

    @pytest.mark.unit
    async def test_create_registration_class_not_found(
        self,
        db_session: AsyncSession,
    ):
        """Test registration creation with non-existent class."""
        registration_data = {
            "name": "John Doe",
            "email": "john@example.com",
            "class_id": uuid.uuid4(),  # Non-existent class
            "preferred_language": "en",
        }

        service = RegistrationService()

        with pytest.raises(ValueError) as exc_info:
            await service.create_registration_with_schedule(
                registration_data, db_session
            )

        assert "Class not found" in str(exc_info.value)

    @pytest.mark.unit
    async def test_create_registration_capacity_check(
        self,
        db_session: AsyncSession,
        yoga_class_in_db: YogaClass,
    ):
        """Test registration creation with capacity validation."""
        # Set class capacity to 1
        yoga_class_in_db.capacity = 1
        schedule_data = {
            "type": "recurring",
            "pattern": {
                "days": ["monday", "wednesday", "friday"],
                "time": "07:00",
            },
            "date_range": {"start_date": None, "end_date": None},
            "exceptions": [],
            "timezone": "UTC",
            "original_schedule": "Mon/Wed/Fri 7:00 AM",
        }
        yoga_class_in_db.schedule_data = json.dumps(schedule_data)
        await db_session.commit()

        target_date = date(2024, 3, 11)  # Monday

        # Create first registration (should succeed)
        registration_data_1 = {
            "name": "John Doe",
            "email": "john@example.com",
            "class_id": yoga_class_in_db.id,
            "target_date": target_date,
            "target_time": time(7, 0),
            "status": "confirmed",
            "preferred_language": "en",
        }

        service = RegistrationService()
        first_registration = await service.create_registration_with_schedule(
            registration_data_1, db_session
        )
        assert first_registration.status == "confirmed"

        # Create second registration (should go to waitlist)
        registration_data_2 = {
            "name": "Jane Smith",
            "email": "jane@example.com",
            "class_id": yoga_class_in_db.id,
            "target_date": target_date,
            "target_time": time(7, 0),
            "preferred_language": "en",
        }

        second_registration = await service.create_registration_with_schedule(
            registration_data_2, db_session
        )
        assert second_registration.status == "waitlist"

    @pytest.mark.unit
    async def test_validate_registration_capacity(
        self,
        db_session: AsyncSession,
        yoga_class_in_db: YogaClass,
    ):
        """Test capacity validation logic."""
        # Set capacity to 2
        yoga_class_in_db.capacity = 2
        await db_session.commit()

        target_date = date(2024, 3, 11)

        service = RegistrationService()

        # No existing registrations
        has_capacity, current_count = await service.validate_registration_capacity(
            yoga_class_in_db.id, target_date, db_session
        )
        assert has_capacity is True
        assert current_count == 0

        # Add one confirmed registration
        registration1 = Registration(
            name="John Doe",
            email="john@example.com",
            class_id=yoga_class_in_db.id,
            target_date=target_date,
            status="confirmed",
            preferred_language="en",
        )
        db_session.add(registration1)
        await db_session.commit()

        has_capacity, current_count = await service.validate_registration_capacity(
            yoga_class_in_db.id, target_date, db_session
        )
        assert has_capacity is True
        assert current_count == 1

        # Add another confirmed registration (at capacity)
        registration2 = Registration(
            name="Jane Smith",
            email="jane@example.com",
            class_id=yoga_class_in_db.id,
            target_date=target_date,
            status="confirmed",
            preferred_language="en",
        )
        db_session.add(registration2)
        await db_session.commit()

        has_capacity, current_count = await service.validate_registration_capacity(
            yoga_class_in_db.id, target_date, db_session
        )
        assert has_capacity is False
        assert current_count == 2

    @pytest.mark.unit
    async def test_validate_registration_capacity_excludes_cancelled(
        self,
        db_session: AsyncSession,
        yoga_class_in_db: YogaClass,
    ):
        """Test that cancelled registrations don't count toward capacity."""
        yoga_class_in_db.capacity = 1
        await db_session.commit()

        target_date = date(2024, 3, 11)

        # Add cancelled registration
        cancelled_registration = Registration(
            name="Cancelled User",
            email="cancelled@example.com",
            class_id=yoga_class_in_db.id,
            target_date=target_date,
            status="cancelled",
            preferred_language="en",
        )
        db_session.add(cancelled_registration)
        await db_session.commit()

        service = RegistrationService()
        has_capacity, current_count = await service.validate_registration_capacity(
            yoga_class_in_db.id, target_date, db_session
        )

        # Should still have capacity since cancelled doesn't count
        assert has_capacity is True
        assert current_count == 0

    @pytest.mark.unit
    async def test_get_registration_by_id(
        self,
        db_session: AsyncSession,
        registration_in_db: Registration,
    ):
        """Test retrieving registration by ID."""
        service = RegistrationService()
        result = await service.get_registration_by_id(
            registration_in_db.id, db_session
        )

        assert result is not None
        assert result.id == registration_in_db.id
        assert result.name == registration_in_db.name

    @pytest.mark.unit
    async def test_get_registration_by_id_not_found(
        self,
        db_session: AsyncSession,
    ):
        """Test retrieving non-existent registration."""
        service = RegistrationService()
        result = await service.get_registration_by_id(
            uuid.uuid4(), db_session
        )

        assert result is None

    @pytest.mark.unit
    async def test_update_registration_status(
        self,
        db_session: AsyncSession,
        registration_in_db: Registration,
    ):
        """Test updating registration status."""
        service = RegistrationService()

        # Update to waitlist
        result = await service.update_registration_status(
            registration_in_db.id, "waitlist", db_session
        )

        assert result is not None
        assert result.status == "waitlist"

        # Verify in database
        await db_session.refresh(registration_in_db)
        assert registration_in_db.status == "waitlist"

    @pytest.mark.unit
    async def test_update_registration_status_not_found(
        self,
        db_session: AsyncSession,
    ):
        """Test updating status of non-existent registration."""
        service = RegistrationService()
        result = await service.update_registration_status(
            uuid.uuid4(), "cancelled", db_session
        )

        assert result is None

    @pytest.mark.unit
    async def test_get_registrations_for_class_date(
        self,
        db_session: AsyncSession,
        yoga_class_in_db: YogaClass,
    ):
        """Test retrieving registrations for specific class date."""
        target_date = date(2024, 3, 11)

        # Create multiple registrations for the same date
        registration1 = Registration(
            name="John Doe",
            email="john@example.com",
            class_id=yoga_class_in_db.id,
            target_date=target_date,
            status="confirmed",
            preferred_language="en",
        )
        registration2 = Registration(
            name="Jane Smith",
            email="jane@example.com",
            class_id=yoga_class_in_db.id,
            target_date=target_date,
            status="waitlist",
            preferred_language="en",
        )
        # Registration for different date
        registration3 = Registration(
            name="Bob Wilson",
            email="bob@example.com",
            class_id=yoga_class_in_db.id,
            target_date=date(2024, 3, 13),  # Different date
            status="confirmed",
            preferred_language="en",
        )

        db_session.add_all([registration1, registration2, registration3])
        await db_session.commit()

        service = RegistrationService()
        registrations = await service.get_registrations_for_class_date(
            yoga_class_in_db.id, target_date, db_session
        )

        assert len(registrations) == 2
        names = [r.name for r in registrations]
        assert "John Doe" in names
        assert "Jane Smith" in names
        assert "Bob Wilson" not in names

    @pytest.mark.unit
    async def test_ensure_schedule_data_exists_with_valid_json(
        self,
        db_session: AsyncSession,
        yoga_class_in_db: YogaClass,
    ):
        """Test ensuring schedule data exists with valid JSON."""
        schedule_data = {
            "type": "recurring",
            "pattern": {"days": ["monday"], "time": "07:00"},
        }
        yoga_class_in_db.schedule_data = json.dumps(schedule_data)
        await db_session.commit()

        service = RegistrationService()
        result = await service.ensure_schedule_data_exists(
            yoga_class_in_db.id, db_session
        )

        assert result == schedule_data

    @pytest.mark.unit
    async def test_ensure_schedule_data_exists_with_invalid_json(
        self,
        db_session: AsyncSession,
        yoga_class_in_db: YogaClass,
    ):
        """Test ensuring schedule data exists with invalid JSON."""
        yoga_class_in_db.schedule_data = "invalid json"
        yoga_class_in_db.schedule = "Mon/Wed/Fri 7:00 AM"
        await db_session.commit()

        service = RegistrationService()

        with patch.object(service, 'schedule_parser') as mock_parser:
            mock_parsed_schedule = {"type": "recurring", "pattern": {"days": ["monday"]}}
            mock_parser.parse_schedule_string.return_value = mock_parsed_schedule

            result = await service.ensure_schedule_data_exists(
                yoga_class_in_db.id, db_session
            )

            assert result == mock_parsed_schedule
            mock_parser.parse_schedule_string.assert_called_once_with("Mon/Wed/Fri 7:00 AM")

            # Verify schedule_data was updated in database
            await db_session.refresh(yoga_class_in_db)
            assert yoga_class_in_db.schedule_data == json.dumps(mock_parsed_schedule)

    @pytest.mark.unit
    async def test_ensure_schedule_data_exists_with_none(
        self,
        db_session: AsyncSession,
        yoga_class_in_db: YogaClass,
    ):
        """Test ensuring schedule data exists when schedule_data is None."""
        yoga_class_in_db.schedule_data = None
        yoga_class_in_db.schedule = "Mon/Wed/Fri 7:00 AM"
        await db_session.commit()

        service = RegistrationService()

        with patch.object(service, 'schedule_parser') as mock_parser:
            mock_parsed_schedule = {"type": "recurring", "pattern": {"days": ["monday"]}}
            mock_parser.parse_schedule_string.return_value = mock_parsed_schedule

            result = await service.ensure_schedule_data_exists(
                yoga_class_in_db.id, db_session
            )

            assert result == mock_parsed_schedule
            mock_parser.parse_schedule_string.assert_called_once_with("Mon/Wed/Fri 7:00 AM")

    @pytest.mark.unit
    async def test_ensure_schedule_data_exists_class_not_found(
        self,
        db_session: AsyncSession,
    ):
        """Test ensuring schedule data exists for non-existent class."""
        service = RegistrationService()
        result = await service.ensure_schedule_data_exists(
            uuid.uuid4(), db_session
        )

        assert result is None

    @pytest.mark.unit
    async def test_create_registration_without_target_date(
        self,
        db_session: AsyncSession,
        yoga_class_in_db: YogaClass,
    ):
        """Test creating registration without target date (for custom schedules)."""
        # Set up custom schedule
        schedule_data = {"type": "custom", "original_schedule": "By appointment"}
        yoga_class_in_db.schedule_data = json.dumps(schedule_data)
        await db_session.commit()

        registration_data = {
            "name": "John Doe",
            "email": "john@example.com",
            "class_id": yoga_class_in_db.id,
            "preferred_language": "en",
        }

        service = RegistrationService()
        result = await service.create_registration_with_schedule(
            registration_data, db_session
        )

        assert result is not None
        assert result.name == "John Doe"
        assert result.target_date is None
        assert result.status == "confirmed"

    @pytest.mark.unit
    async def test_registration_with_message_and_phone(
        self,
        db_session: AsyncSession,
        yoga_class_in_db: YogaClass,
    ):
        """Test registration creation with optional message and phone."""
        schedule_data = {
            "type": "recurring",
            "pattern": {
                "days": ["monday"],
                "time": "07:00",
            },
            "date_range": {"start_date": None, "end_date": None},
            "exceptions": [],
            "timezone": "UTC",
        }
        yoga_class_in_db.schedule_data = json.dumps(schedule_data)
        await db_session.commit()

        registration_data = {
            "name": "John Doe",
            "email": "john@example.com",
            "phone": "+1234567890",
            "message": "Looking forward to the class!",
            "class_id": yoga_class_in_db.id,
            "target_date": date(2024, 3, 11),  # Monday
            "target_time": time(7, 0),
            "preferred_language": "en",
            "email_notifications": True,
            "sms_notifications": False,
        }

        service = RegistrationService()
        result = await service.create_registration_with_schedule(
            registration_data, db_session
        )

        assert result.phone == "+1234567890"
        assert result.message == "Looking forward to the class!"
        assert result.email_notifications is True
        assert result.sms_notifications is False