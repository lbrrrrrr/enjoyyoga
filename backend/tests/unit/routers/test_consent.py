"""Unit tests for consent router endpoints."""
import uuid

import pytest
from httpx import AsyncClient

from app.auth import create_access_token
from app.models.admin_user import AdminUser
from app.models.consent_record import ConsentRecord
from app.models.yoga_type import YogaType
from sqlalchemy.ext.asyncio import AsyncSession


class TestPublicConsentRouter:
    """Test cases for public consent endpoints."""

    @pytest.mark.unit
    async def test_check_consent_no_record(
        self, client: AsyncClient, yoga_type_in_db: YogaType
    ):
        """Test checking consent when none exists."""
        response = await client.get(
            "/api/consent/check",
            params={"email": "nobody@example.com", "yoga_type_id": str(yoga_type_in_db.id)},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["has_consent"] is False
        assert data["consent"] is None

    @pytest.mark.unit
    async def test_check_consent_with_record(
        self, client: AsyncClient, db_session: AsyncSession, yoga_type_in_db: YogaType
    ):
        """Test checking consent when one exists."""
        record = ConsentRecord(
            email="exists@example.com",
            name="Exists User",
            yoga_type_id=yoga_type_in_db.id,
            consent_text_version="1.0",
        )
        db_session.add(record)
        await db_session.commit()

        response = await client.get(
            "/api/consent/check",
            params={"email": "exists@example.com", "yoga_type_id": str(yoga_type_in_db.id)},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["has_consent"] is True
        assert data["consent"]["email"] == "exists@example.com"

    @pytest.mark.unit
    async def test_check_consent_missing_params(self, client: AsyncClient):
        """Test checking consent without required params."""
        response = await client.get("/api/consent/check")
        assert response.status_code == 422

    @pytest.mark.unit
    async def test_sign_consent(
        self, client: AsyncClient, yoga_type_in_db: YogaType
    ):
        """Test signing a consent waiver."""
        response = await client.post(
            "/api/consent/sign",
            json={
                "email": "signer@example.com",
                "name": "Signer",
                "yoga_type_id": str(yoga_type_in_db.id),
                "consent_text_version": "1.0",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "signer@example.com"
        assert data["name"] == "Signer"
        assert data["yoga_type_id"] == str(yoga_type_in_db.id)

    @pytest.mark.unit
    async def test_sign_consent_idempotent(
        self, client: AsyncClient, yoga_type_in_db: YogaType
    ):
        """Test that signing the same consent twice returns the same record."""
        payload = {
            "email": "twice@example.com",
            "name": "Twice User",
            "yoga_type_id": str(yoga_type_in_db.id),
        }
        resp1 = await client.post("/api/consent/sign", json=payload)
        resp2 = await client.post("/api/consent/sign", json=payload)

        assert resp1.status_code == 201
        assert resp2.status_code == 201
        assert resp1.json()["id"] == resp2.json()["id"]

    @pytest.mark.unit
    async def test_sign_consent_missing_fields(
        self, client: AsyncClient, yoga_type_in_db: YogaType
    ):
        """Test signing consent with missing required fields."""
        response = await client.post(
            "/api/consent/sign",
            json={"email": "test@example.com"},
        )
        assert response.status_code == 422

    @pytest.mark.unit
    async def test_sign_consent_captures_ip(
        self, client: AsyncClient, yoga_type_in_db: YogaType
    ):
        """Test that signing consent captures the client IP address."""
        response = await client.post(
            "/api/consent/sign",
            json={
                "email": "ip@example.com",
                "name": "IP User",
                "yoga_type_id": str(yoga_type_in_db.id),
            },
        )
        assert response.status_code == 201
        data = response.json()
        # IP should be captured (test client uses 127.0.0.1)
        assert data["ip_address"] is not None


class TestAdminConsentRouter:
    """Test cases for admin consent endpoints."""

    @pytest.mark.unit
    async def test_list_consents_unauthorized(self, client: AsyncClient):
        """Test listing consents without auth returns 401."""
        response = await client.get("/api/admin/consent/consents")
        assert response.status_code == 401

    @pytest.mark.unit
    async def test_list_consents_empty(
        self, client: AsyncClient, admin_user_in_db: AdminUser
    ):
        """Test listing consents when none exist."""
        token = create_access_token({"sub": str(admin_user_in_db.id)})
        response = await client.get(
            "/api/admin/consent/consents",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        assert response.json() == []

    @pytest.mark.unit
    async def test_list_consents(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        admin_user_in_db: AdminUser,
        yoga_type_in_db: YogaType,
    ):
        """Test listing consent records."""
        for i in range(3):
            record = ConsentRecord(
                email=f"user{i}@example.com",
                name=f"User {i}",
                yoga_type_id=yoga_type_in_db.id,
                consent_text_version="1.0",
            )
            db_session.add(record)
        await db_session.commit()

        token = create_access_token({"sub": str(admin_user_in_db.id)})
        response = await client.get(
            "/api/admin/consent/consents",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert data[0]["yoga_type_name_en"] == "Hatha Yoga"

    @pytest.mark.unit
    async def test_list_consents_filter_email(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        admin_user_in_db: AdminUser,
        yoga_type_in_db: YogaType,
    ):
        """Test filtering consent records by email."""
        for email in ["alice@test.com", "bob@test.com"]:
            record = ConsentRecord(
                email=email, name="User", yoga_type_id=yoga_type_in_db.id,
                consent_text_version="1.0",
            )
            db_session.add(record)
        await db_session.commit()

        token = create_access_token({"sub": str(admin_user_in_db.id)})
        response = await client.get(
            "/api/admin/consent/consents",
            params={"email": "alice@test.com"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["email"] == "alice@test.com"

    @pytest.mark.unit
    async def test_list_consents_pagination(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        admin_user_in_db: AdminUser,
        yoga_type_in_db: YogaType,
    ):
        """Test pagination of consent records."""
        for i in range(5):
            record = ConsentRecord(
                email=f"page{i}@example.com",
                name=f"User {i}",
                yoga_type_id=yoga_type_in_db.id,
                consent_text_version="1.0",
            )
            db_session.add(record)
        await db_session.commit()

        token = create_access_token({"sub": str(admin_user_in_db.id)})
        response = await client.get(
            "/api/admin/consent/consents",
            params={"limit": 2, "offset": 0},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        assert len(response.json()) == 2

    @pytest.mark.unit
    async def test_consent_stats_unauthorized(self, client: AsyncClient):
        """Test consent stats without auth returns 401."""
        response = await client.get("/api/admin/consent/stats")
        assert response.status_code == 401

    @pytest.mark.unit
    async def test_consent_stats_empty(
        self, client: AsyncClient, admin_user_in_db: AdminUser
    ):
        """Test consent stats when no consents exist."""
        token = create_access_token({"sub": str(admin_user_in_db.id)})
        response = await client.get(
            "/api/admin/consent/stats",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0

    @pytest.mark.unit
    async def test_consent_stats(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        admin_user_in_db: AdminUser,
        yoga_type_in_db: YogaType,
    ):
        """Test consent stats with records."""
        for i in range(3):
            record = ConsentRecord(
                email=f"stat{i}@example.com",
                name=f"User {i}",
                yoga_type_id=yoga_type_in_db.id,
                consent_text_version="1.0",
            )
            db_session.add(record)
        await db_session.commit()

        token = create_access_token({"sub": str(admin_user_in_db.id)})
        response = await client.get(
            "/api/admin/consent/stats",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 3
        assert len(data["by_yoga_type"]) >= 1

    @pytest.mark.unit
    async def test_consent_stats_with_expired_token(
        self, client: AsyncClient, expired_jwt_token: str
    ):
        """Test consent stats with an expired JWT token."""
        response = await client.get(
            "/api/admin/consent/stats",
            headers={"Authorization": f"Bearer {expired_jwt_token}"},
        )
        assert response.status_code == 401
