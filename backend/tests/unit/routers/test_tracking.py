"""Unit tests for tracking router endpoints."""
import uuid
from datetime import date, time

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import patch, AsyncMock

from app.models.registration import Registration
from app.models.tracking_token import TrackingToken
from app.models.payment import Payment
from app.models.yoga_class import YogaClass
from app.models.teacher import Teacher
from app.models.yoga_type import YogaType


class TestGetRegistrationsByToken:
    """Test cases for GET /api/track/{token}."""

    @pytest.mark.unit
    async def test_valid_token_returns_registrations(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        registration_in_db: Registration,
    ):
        """Test that a valid token returns all registrations for that email."""
        # Create a tracking token for the registration's email
        token = TrackingToken(email=registration_in_db.email, token="a" * 64)
        db_session.add(token)
        await db_session.commit()

        response = await client.get(f"/api/track/{'a' * 64}")
        assert response.status_code == 200

        data = response.json()
        assert data["email"] == registration_in_db.email
        assert data["total"] >= 1
        assert len(data["registrations"]) >= 1

        reg = data["registrations"][0]
        assert reg["registration_id"] == str(registration_in_db.id)
        assert reg["status"] == registration_in_db.status

    @pytest.mark.unit
    async def test_valid_token_includes_class_info(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        registration_in_db: Registration,
        yoga_class_in_db: YogaClass,
    ):
        """Test that response includes class name info."""
        token = TrackingToken(email=registration_in_db.email, token="b" * 64)
        db_session.add(token)
        await db_session.commit()

        response = await client.get(f"/api/track/{'b' * 64}")
        assert response.status_code == 200

        reg = response.json()["registrations"][0]
        assert reg["class_name_en"] == yoga_class_in_db.name_en
        assert reg["class_name_zh"] == yoga_class_in_db.name_zh

    @pytest.mark.unit
    async def test_valid_token_includes_date_time(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        registration_in_db: Registration,
    ):
        """Test that response includes target date and time."""
        token = TrackingToken(email=registration_in_db.email, token="c" * 64)
        db_session.add(token)
        await db_session.commit()

        response = await client.get(f"/api/track/{'c' * 64}")
        assert response.status_code == 200

        reg = response.json()["registrations"][0]
        assert reg["target_date"] == str(registration_in_db.target_date)
        assert reg["target_time"] is not None

    @pytest.mark.unit
    async def test_invalid_token_returns_404(self, client: AsyncClient):
        """Test that an invalid token returns 404."""
        response = await client.get("/api/track/nonexistent_token")
        assert response.status_code == 404
        assert response.json()["detail"] == "Invalid tracking link"

    @pytest.mark.unit
    async def test_empty_registrations(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
    ):
        """Test token with email that has no registrations returns empty list."""
        token = TrackingToken(email="nobody@example.com", token="d" * 64)
        db_session.add(token)
        await db_session.commit()

        response = await client.get(f"/api/track/{'d' * 64}")
        assert response.status_code == 200

        data = response.json()
        assert data["email"] == "nobody@example.com"
        assert data["registrations"] == []
        assert data["total"] == 0

    @pytest.mark.unit
    async def test_registration_with_payment(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        yoga_class_in_db: YogaClass,
    ):
        """Test that payment info is included when a payment exists."""
        # Create registration and payment together so relationship loads properly
        email = "payer@example.com"
        reg = Registration(
            name="Payer",
            email=email,
            phone="+1234567890",
            class_id=yoga_class_in_db.id,
            target_date=date(2026, 3, 15),
            target_time=time(7, 0),
            status="pending_payment",
            preferred_language="en",
        )
        db_session.add(reg)
        await db_session.flush()

        payment = Payment(
            registration_id=reg.id,
            amount=100.0,
            currency="CNY",
            payment_method="wechat_qr",
            status="pending",
            reference_number="EY-20260217-TEST",
        )
        db_session.add(payment)

        token = TrackingToken(email=email, token="e" * 64)
        db_session.add(token)
        await db_session.commit()

        response = await client.get(f"/api/track/{'e' * 64}")
        assert response.status_code == 200

        reg_data = response.json()["registrations"][0]
        assert reg_data["payment_status"] == "pending"
        assert reg_data["reference_number"] == "EY-20260217-TEST"
        assert reg_data["amount"] == 100.0
        assert reg_data["currency"] == "CNY"

    @pytest.mark.unit
    async def test_registration_without_payment(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        registration_in_db: Registration,
    ):
        """Test that payment fields are null when no payment exists."""
        token = TrackingToken(email=registration_in_db.email, token="f" * 64)
        db_session.add(token)
        await db_session.commit()

        response = await client.get(f"/api/track/{'f' * 64}")
        assert response.status_code == 200

        reg = response.json()["registrations"][0]
        assert reg["payment_status"] is None
        assert reg["reference_number"] is None
        assert reg["amount"] is None
        assert reg["currency"] is None

    @pytest.mark.unit
    async def test_multiple_registrations(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        yoga_class_in_db: YogaClass,
    ):
        """Test token returns multiple registrations for the same email."""
        email = "multi@example.com"

        # Create two registrations for the same email
        for i in range(2):
            reg = Registration(
                name="Multi User",
                email=email,
                phone="+1234567890",
                class_id=yoga_class_in_db.id,
                target_date=date(2026, 3, 15 + i),
                target_time=time(7, 0),
                status="confirmed",
                preferred_language="en",
            )
            db_session.add(reg)

        token = TrackingToken(email=email, token="g" * 64)
        db_session.add(token)
        await db_session.commit()

        response = await client.get(f"/api/track/{'g' * 64}")
        assert response.status_code == 200

        data = response.json()
        assert data["total"] == 2
        assert len(data["registrations"]) == 2


class TestRequestTrackingLink:
    """Test cases for POST /api/track/request-link."""

    @pytest.mark.unit
    async def test_request_link_always_returns_200(self, client: AsyncClient):
        """Test that request-link always returns 200 (anti-enumeration)."""
        with patch(
            "app.routers.tracking.NotificationService"
        ) as MockNotification:
            mock_instance = MockNotification.return_value
            mock_instance.send_tracking_link_email = AsyncMock()

            response = await client.post(
                "/api/track/request-link",
                json={"email": "anyone@example.com", "preferred_language": "en"},
            )
            assert response.status_code == 200

    @pytest.mark.unit
    async def test_request_link_response_message(self, client: AsyncClient):
        """Test response message does not reveal whether email exists."""
        with patch(
            "app.routers.tracking.NotificationService"
        ) as MockNotification:
            mock_instance = MockNotification.return_value
            mock_instance.send_tracking_link_email = AsyncMock()

            response = await client.post(
                "/api/track/request-link",
                json={"email": "unknown@example.com"},
            )
            data = response.json()
            assert "message" in data
            # Message should not reveal whether the email exists
            assert "tracking link has been sent" in data["message"].lower() or "account exists" in data["message"].lower()

    @pytest.mark.unit
    async def test_request_link_creates_token(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test that request-link creates a tracking token."""
        with patch(
            "app.routers.tracking.NotificationService"
        ) as MockNotification:
            mock_instance = MockNotification.return_value
            mock_instance.send_tracking_link_email = AsyncMock()

            response = await client.post(
                "/api/track/request-link",
                json={"email": "newtoken@example.com", "preferred_language": "en"},
            )
            assert response.status_code == 200

    @pytest.mark.unit
    async def test_request_link_default_language(self, client: AsyncClient):
        """Test that preferred_language defaults to 'en'."""
        with patch(
            "app.routers.tracking.NotificationService"
        ) as MockNotification:
            mock_instance = MockNotification.return_value
            mock_instance.send_tracking_link_email = AsyncMock()

            response = await client.post(
                "/api/track/request-link",
                json={"email": "default@example.com"},
            )
            assert response.status_code == 200

    @pytest.mark.unit
    async def test_request_link_missing_email(self, client: AsyncClient):
        """Test that request-link requires email field."""
        response = await client.post(
            "/api/track/request-link",
            json={},
        )
        assert response.status_code == 422

    @pytest.mark.unit
    async def test_request_link_zh_language(self, client: AsyncClient):
        """Test request-link with Chinese language preference."""
        with patch(
            "app.routers.tracking.NotificationService"
        ) as MockNotification:
            mock_instance = MockNotification.return_value
            mock_instance.send_tracking_link_email = AsyncMock()

            response = await client.post(
                "/api/track/request-link",
                json={"email": "zh@example.com", "preferred_language": "zh"},
            )
            assert response.status_code == 200
