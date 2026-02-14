"""Unit tests for registrations router."""
import json
import uuid
from datetime import date, time
from unittest.mock import patch

import pytest
from httpx import AsyncClient

from app.models.yoga_class import YogaClass


class TestRegistrationsRouter:
    """Test cases for registrations router endpoints."""

    @pytest.mark.unit
    async def test_create_registration_basic_success(
        self,
        client: AsyncClient,
        yoga_class_in_db: YogaClass,
    ):
        """Test successful basic registration creation."""
        registration_data = {
            "name": "John Doe",
            "email": "john@example.com",
            "phone": "+1234567890",
            "message": "Looking forward to the class!",
            "class_id": str(yoga_class_in_db.id),
            "preferred_language": "en",
            "email_notifications": True,
            "sms_notifications": False,
        }

        response = await client.post("/api/registrations", json=registration_data)

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "John Doe"
        assert data["email"] == "john@example.com"
        assert data["class_id"] == str(yoga_class_in_db.id)
        assert data["status"] == "confirmed"

    @pytest.mark.unit
    async def test_create_registration_missing_required_fields(self, client: AsyncClient):
        """Test registration creation with missing required fields."""
        # Missing name
        response = await client.post(
            "/api/registrations",
            json={
                "email": "john@example.com",
                "class_id": str(uuid.uuid4()),
                "preferred_language": "en",
            }
        )
        assert response.status_code == 422

        # Missing email
        response = await client.post(
            "/api/registrations",
            json={
                "name": "John Doe",
                "class_id": str(uuid.uuid4()),
                "preferred_language": "en",
            }
        )
        assert response.status_code == 422

        # Missing class_id
        response = await client.post(
            "/api/registrations",
            json={
                "name": "John Doe",
                "email": "john@example.com",
                "preferred_language": "en",
            }
        )
        assert response.status_code == 422

    @pytest.mark.unit
    async def test_create_registration_invalid_email(
        self,
        client: AsyncClient,
        yoga_class_in_db: YogaClass,
    ):
        """Test registration creation with invalid email format."""
        registration_data = {
            "name": "John Doe",
            "email": "invalid-email-format",
            "class_id": str(yoga_class_in_db.id),
            "preferred_language": "en",
        }

        response = await client.post("/api/registrations", json=registration_data)
        assert response.status_code == 422

    @pytest.mark.unit
    async def test_create_registration_invalid_class_id(self, client: AsyncClient):
        """Test registration creation with non-existent class."""
        registration_data = {
            "name": "John Doe",
            "email": "john@example.com",
            "class_id": str(uuid.uuid4()),  # Non-existent class
            "preferred_language": "en",
        }

        response = await client.post("/api/registrations", json=registration_data)
        assert response.status_code == 404
        assert "Class not found" in response.json()["detail"]

    @pytest.mark.unit
    async def test_create_registration_with_schedule_success(
        self,
        client: AsyncClient,
        yoga_class_in_db: YogaClass,
    ):
        """Test successful registration creation with schedule validation."""
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

        registration_data = {
            "name": "John Doe",
            "email": "john@example.com",
            "class_id": str(yoga_class_in_db.id),
            "target_date": "2024-03-11",  # Monday
            "target_time": "07:00",
            "preferred_language": "en",
        }

        with patch('app.services.notification_service.NotificationService.send_confirmation_email') as mock_email:
            mock_email.return_value = True

            response = await client.post(
                "/api/registrations/with-schedule", json=registration_data
            )

            assert response.status_code == 201
            data = response.json()
            assert data["name"] == "John Doe"
            assert data["target_date"] == "2024-03-11"
            assert data["status"] == "confirmed"

    @pytest.mark.unit
    async def test_create_registration_with_schedule_invalid_date(
        self,
        client: AsyncClient,
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

        registration_data = {
            "name": "John Doe",
            "email": "john@example.com",
            "class_id": str(yoga_class_in_db.id),
            "target_date": "2024-03-12",  # Tuesday (not valid)
            "target_time": "07:00",
            "preferred_language": "en",
        }

        response = await client.post(
            "/api/registrations/with-schedule", json=registration_data
        )

        assert response.status_code == 400
        assert "not available on this date" in response.json()["detail"]

    @pytest.mark.unit
    async def test_create_registration_with_schedule_email_notification(
        self,
        client: AsyncClient,
        yoga_class_in_db: YogaClass,
        db_session,
    ):
        """Test that email notification is sent when enabled."""
        # Set up schedule data
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
            "class_id": str(yoga_class_in_db.id),
            "target_date": "2024-03-11",  # Monday
            "target_time": "07:00",
            "preferred_language": "en",
            "email_notifications": True,
        }

        with patch('app.services.notification_service.NotificationService.send_confirmation_email') as mock_email:
            mock_email.return_value = True

            response = await client.post(
                "/api/registrations/with-schedule", json=registration_data
            )

            assert response.status_code == 201
            mock_email.assert_called_once()

    @pytest.mark.unit
    async def test_create_registration_with_schedule_no_email_notification(
        self,
        client: AsyncClient,
        yoga_class_in_db: YogaClass,
        db_session,
    ):
        """Test that email notification is not sent when disabled."""
        # Set up schedule data
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
            "class_id": str(yoga_class_in_db.id),
            "target_date": "2024-03-11",  # Monday
            "target_time": "07:00",
            "preferred_language": "en",
            "email_notifications": False,
        }

        with patch('app.services.notification_service.NotificationService.send_confirmation_email') as mock_email:
            response = await client.post(
                "/api/registrations/with-schedule", json=registration_data
            )

            assert response.status_code == 201
            mock_email.assert_not_called()

    @pytest.mark.unit
    async def test_get_available_dates_success(
        self,
        client: AsyncClient,
        yoga_class_in_db: YogaClass,
        db_session,
    ):
        """Test getting available dates for a class."""
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

        response = await client.get(f"/api/registrations/available-dates/{yoga_class_in_db.id}")

        assert response.status_code == 200
        data = response.json()
        assert "available_dates" in data
        assert isinstance(data["available_dates"], list)

        # Should return multiple dates
        assert len(data["available_dates"]) > 0

        # Each date should have required fields
        for date_info in data["available_dates"]:
            assert "date" in date_info
            assert "available_spots" in date_info
            assert "total_capacity" in date_info

    @pytest.mark.unit
    async def test_get_available_dates_class_not_found(self, client: AsyncClient):
        """Test getting available dates for non-existent class."""
        non_existent_id = str(uuid.uuid4())
        response = await client.get(f"/api/registrations/available-dates/{non_existent_id}")

        assert response.status_code == 404

    @pytest.mark.unit
    async def test_get_available_dates_invalid_uuid(self, client: AsyncClient):
        """Test getting available dates with invalid UUID format."""
        response = await client.get("/api/registrations/available-dates/not-a-uuid")
        assert response.status_code == 422

    @pytest.mark.unit
    async def test_get_registrations_for_date_success(
        self,
        client: AsyncClient,
        yoga_class_in_db: YogaClass,
        db_session,
    ):
        """Test getting registrations for specific date."""
        # Create test registrations
        from app.models.registration import Registration

        target_date = date(2024, 3, 11)

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

        db_session.add_all([registration1, registration2])
        await db_session.commit()

        response = await client.get(
            f"/api/registrations/by-date/{yoga_class_in_db.id}",
            params={"date": "2024-03-11"}
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2

        # Check registration data
        names = [r["name"] for r in data]
        assert "John Doe" in names
        assert "Jane Smith" in names

    @pytest.mark.unit
    async def test_get_registrations_for_date_no_registrations(
        self,
        client: AsyncClient,
        yoga_class_in_db: YogaClass,
    ):
        """Test getting registrations for date with no registrations."""
        response = await client.get(
            f"/api/registrations/by-date/{yoga_class_in_db.id}",
            params={"date": "2024-03-11"}
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    @pytest.mark.unit
    async def test_get_registrations_for_date_invalid_date_format(
        self,
        client: AsyncClient,
        yoga_class_in_db: YogaClass,
    ):
        """Test getting registrations with invalid date format."""
        response = await client.get(
            f"/api/registrations/by-date/{yoga_class_in_db.id}",
            params={"date": "invalid-date"}
        )

        assert response.status_code == 422

    @pytest.mark.unit
    async def test_create_registration_capacity_handling(
        self,
        client: AsyncClient,
        yoga_class_in_db: YogaClass,
        db_session,
    ):
        """Test registration capacity handling."""
        # Set capacity to 1
        yoga_class_in_db.capacity = 1

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

        # First registration should be confirmed
        registration_data_1 = {
            "name": "John Doe",
            "email": "john@example.com",
            "class_id": str(yoga_class_in_db.id),
            "target_date": "2024-03-11",  # Monday
            "target_time": "07:00",
            "preferred_language": "en",
        }

        with patch('app.services.notification_service.NotificationService.send_confirmation_email'):
            response1 = await client.post(
                "/api/registrations/with-schedule", json=registration_data_1
            )

            assert response1.status_code == 201
            assert response1.json()["status"] == "confirmed"

            # Second registration should go to waitlist
            registration_data_2 = {
                "name": "Jane Smith",
                "email": "jane@example.com",
                "class_id": str(yoga_class_in_db.id),
                "target_date": "2024-03-11",  # Monday
                "target_time": "07:00",
                "preferred_language": "en",
            }

            response2 = await client.post(
                "/api/registrations/with-schedule", json=registration_data_2
            )

            assert response2.status_code == 201
            assert response2.json()["status"] == "waitlist"

    @pytest.mark.unit
    async def test_registration_with_optional_fields(
        self,
        client: AsyncClient,
        yoga_class_in_db: YogaClass,
    ):
        """Test registration creation with all optional fields."""
        registration_data = {
            "name": "John Doe",
            "email": "john@example.com",
            "phone": "+1234567890",
            "message": "Looking forward to the class!",
            "class_id": str(yoga_class_in_db.id),
            "preferred_language": "zh",
            "email_notifications": True,
            "sms_notifications": True,
        }

        response = await client.post("/api/registrations", json=registration_data)

        assert response.status_code == 201
        data = response.json()
        assert data["phone"] == "+1234567890"
        assert data["message"] == "Looking forward to the class!"
        assert data["preferred_language"] == "zh"
        assert data["email_notifications"] is True
        assert data["sms_notifications"] is True

    @pytest.mark.unit
    async def test_registration_language_preference_validation(
        self,
        client: AsyncClient,
        yoga_class_in_db: YogaClass,
    ):
        """Test language preference validation."""
        # Valid language preferences
        for lang in ["en", "zh"]:
            registration_data = {
                "name": "John Doe",
                "email": f"john{lang}@example.com",
                "class_id": str(yoga_class_in_db.id),
                "preferred_language": lang,
            }

            response = await client.post("/api/registrations", json=registration_data)
            assert response.status_code == 201

        # Invalid language preference
        registration_data = {
            "name": "John Doe",
            "email": "john@example.com",
            "class_id": str(yoga_class_in_db.id),
            "preferred_language": "fr",  # Not supported
        }

        response = await client.post("/api/registrations", json=registration_data)
        assert response.status_code == 422

    @pytest.mark.unit
    async def test_available_dates_capacity_calculation(
        self,
        client: AsyncClient,
        yoga_class_in_db: YogaClass,
        db_session,
    ):
        """Test that available dates show correct capacity calculation."""
        # Set capacity to 5
        yoga_class_in_db.capacity = 5

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

        # Create 2 confirmed registrations for a specific date
        from app.models.registration import Registration

        target_date = date(2024, 3, 11)  # Monday

        for i in range(2):
            registration = Registration(
                name=f"User {i}",
                email=f"user{i}@example.com",
                class_id=yoga_class_in_db.id,
                target_date=target_date,
                status="confirmed",
                preferred_language="en",
            )
            db_session.add(registration)

        await db_session.commit()

        response = await client.get(f"/api/registrations/available-dates/{yoga_class_in_db.id}")

        assert response.status_code == 200
        data = response.json()

        # Find the target date in the response
        target_date_info = None
        for date_info in data["available_dates"]:
            if date_info["date"] == "2024-03-11":
                target_date_info = date_info
                break

        assert target_date_info is not None
        assert target_date_info["total_capacity"] == 5
        assert target_date_info["available_spots"] == 3  # 5 - 2 confirmed registrations