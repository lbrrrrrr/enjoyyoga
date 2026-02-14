"""Unit tests for admin router."""
import uuid
from datetime import datetime, timedelta
from unittest.mock import patch

import pytest
from httpx import AsyncClient

from app.auth import create_access_token
from app.models.admin_user import AdminUser
from app.models.registration import Registration


class TestAdminRouter:
    """Test cases for admin router endpoints."""

    @pytest.mark.unit
    async def test_admin_login_success(
        self,
        client: AsyncClient,
        admin_user_in_db: AdminUser,
    ):
        """Test successful admin login."""
        from app.auth import get_password_hash

        # Set known password for admin user
        password = "test_password"
        admin_user_in_db.hashed_password = get_password_hash(password)
        admin_user_in_db.is_active = True

        login_data = {
            "username": admin_user_in_db.username,
            "password": password,
        }

        response = await client.post("/api/admin/login", json=login_data)

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "admin" in data
        assert data["admin"]["username"] == admin_user_in_db.username

    @pytest.mark.unit
    async def test_admin_login_invalid_credentials(
        self,
        client: AsyncClient,
        admin_user_in_db: AdminUser,
    ):
        """Test admin login with invalid credentials."""
        login_data = {
            "username": admin_user_in_db.username,
            "password": "wrong_password",
        }

        response = await client.post("/api/admin/login", json=login_data)

        assert response.status_code == 401
        assert "Incorrect username or password" in response.json()["detail"]

    @pytest.mark.unit
    async def test_admin_login_missing_fields(self, client: AsyncClient):
        """Test admin login with missing fields."""
        # Missing password
        response = await client.post(
            "/api/admin/login", json={"username": "admin"}
        )
        assert response.status_code == 422

        # Missing username
        response = await client.post(
            "/api/admin/login", json={"password": "password"}
        )
        assert response.status_code == 422

        # Empty request
        response = await client.post("/api/admin/login", json={})
        assert response.status_code == 422

    @pytest.mark.unit
    async def test_get_current_admin_info_success(
        self,
        client: AsyncClient,
        admin_user_in_db: AdminUser,
    ):
        """Test getting current admin info with valid token."""
        token = create_access_token({"sub": str(admin_user_in_db.id)})
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.get("/api/admin/me", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["username"] == admin_user_in_db.username
        assert data["email"] == admin_user_in_db.email
        assert data["role"] == admin_user_in_db.role

    @pytest.mark.unit
    async def test_get_current_admin_info_unauthorized(self, client: AsyncClient):
        """Test getting admin info without authentication."""
        response = await client.get("/api/admin/me")
        assert response.status_code == 401

    @pytest.mark.unit
    async def test_get_current_admin_info_invalid_token(self, client: AsyncClient):
        """Test getting admin info with invalid token."""
        headers = {"Authorization": "Bearer invalid.jwt.token"}
        response = await client.get("/api/admin/me", headers=headers)
        assert response.status_code == 401

    @pytest.mark.unit
    async def test_get_dashboard_stats_success(
        self,
        client: AsyncClient,
        admin_user_in_db: AdminUser,
        registration_in_db: Registration,
    ):
        """Test getting dashboard statistics."""
        token = create_access_token({"sub": str(admin_user_in_db.id)})
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.get("/api/admin/dashboard/stats", headers=headers)

        assert response.status_code == 200
        data = response.json()

        assert "total_registrations" in data
        assert "total_teachers" in data
        assert "total_classes" in data
        assert "recent_registrations" in data

        assert isinstance(data["total_registrations"], int)
        assert isinstance(data["total_teachers"], int)
        assert isinstance(data["total_classes"], int)
        assert isinstance(data["recent_registrations"], list)

        # Should have at least one registration from fixture
        assert data["total_registrations"] >= 1

    @pytest.mark.unit
    async def test_get_dashboard_stats_unauthorized(self, client: AsyncClient):
        """Test getting dashboard stats without authentication."""
        response = await client.get("/api/admin/dashboard/stats")
        assert response.status_code == 401

    @pytest.mark.unit
    async def test_list_registrations_success(
        self,
        client: AsyncClient,
        admin_user_in_db: AdminUser,
        registration_in_db: Registration,
    ):
        """Test listing all registrations."""
        token = create_access_token({"sub": str(admin_user_in_db.id)})
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.get("/api/admin/registrations", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

        # Check registration structure
        registration = data[0]
        assert "id" in registration
        assert "name" in registration
        assert "email" in registration
        assert "status" in registration
        assert "class_id" in registration

    @pytest.mark.unit
    async def test_list_registrations_unauthorized(self, client: AsyncClient):
        """Test listing registrations without authentication."""
        response = await client.get("/api/admin/registrations")
        assert response.status_code == 401

    @pytest.mark.unit
    async def test_get_registration_success(
        self,
        client: AsyncClient,
        admin_user_in_db: AdminUser,
        registration_in_db: Registration,
    ):
        """Test getting specific registration."""
        token = create_access_token({"sub": str(admin_user_in_db.id)})
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.get(
            f"/api/admin/registrations/{registration_in_db.id}",
            headers=headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(registration_in_db.id)
        assert data["name"] == registration_in_db.name
        assert data["email"] == registration_in_db.email

    @pytest.mark.unit
    async def test_get_registration_not_found(
        self,
        client: AsyncClient,
        admin_user_in_db: AdminUser,
    ):
        """Test getting non-existent registration."""
        token = create_access_token({"sub": str(admin_user_in_db.id)})
        headers = {"Authorization": f"Bearer {token}"}

        non_existent_id = str(uuid.uuid4())
        response = await client.get(
            f"/api/admin/registrations/{non_existent_id}",
            headers=headers
        )

        assert response.status_code == 404

    @pytest.mark.unit
    async def test_get_registration_invalid_uuid(
        self,
        client: AsyncClient,
        admin_user_in_db: AdminUser,
    ):
        """Test getting registration with invalid UUID format."""
        token = create_access_token({"sub": str(admin_user_in_db.id)})
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.get(
            "/api/admin/registrations/not-a-uuid",
            headers=headers
        )

        assert response.status_code == 422

    @pytest.mark.unit
    async def test_update_registration_status_success(
        self,
        client: AsyncClient,
        admin_user_in_db: AdminUser,
        registration_in_db: Registration,
    ):
        """Test updating registration status."""
        token = create_access_token({"sub": str(admin_user_in_db.id)})
        headers = {"Authorization": f"Bearer {token}"}

        update_data = {"status": "waitlist"}

        response = await client.put(
            f"/api/admin/registrations/{registration_in_db.id}/status",
            json=update_data,
            headers=headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "waitlist"

    @pytest.mark.unit
    async def test_update_registration_status_invalid_status(
        self,
        client: AsyncClient,
        admin_user_in_db: AdminUser,
        registration_in_db: Registration,
    ):
        """Test updating registration with invalid status."""
        token = create_access_token({"sub": str(admin_user_in_db.id)})
        headers = {"Authorization": f"Bearer {token}"}

        update_data = {"status": "invalid_status"}

        response = await client.put(
            f"/api/admin/registrations/{registration_in_db.id}/status",
            json=update_data,
            headers=headers
        )

        assert response.status_code == 400
        assert "Invalid status" in response.json()["detail"]

    @pytest.mark.unit
    async def test_update_registration_status_not_found(
        self,
        client: AsyncClient,
        admin_user_in_db: AdminUser,
    ):
        """Test updating status of non-existent registration."""
        token = create_access_token({"sub": str(admin_user_in_db.id)})
        headers = {"Authorization": f"Bearer {token}"}

        update_data = {"status": "confirmed"}
        non_existent_id = str(uuid.uuid4())

        response = await client.put(
            f"/api/admin/registrations/{non_existent_id}/status",
            json=update_data,
            headers=headers
        )

        assert response.status_code == 404

    @pytest.mark.unit
    async def test_update_registration_status_unauthorized(
        self,
        client: AsyncClient,
        registration_in_db: Registration,
    ):
        """Test updating registration status without authentication."""
        update_data = {"status": "confirmed"}

        response = await client.put(
            f"/api/admin/registrations/{registration_in_db.id}/status",
            json=update_data
        )

        assert response.status_code == 401

    @pytest.mark.unit
    async def test_admin_login_inactive_user(
        self,
        client: AsyncClient,
        admin_user_in_db: AdminUser,
    ):
        """Test admin login with inactive user account."""
        from app.auth import get_password_hash

        password = "test_password"
        admin_user_in_db.hashed_password = get_password_hash(password)
        admin_user_in_db.is_active = False  # Inactive user

        login_data = {
            "username": admin_user_in_db.username,
            "password": password,
        }

        response = await client.post("/api/admin/login", json=login_data)

        assert response.status_code == 401
        assert "Incorrect username or password" in response.json()["detail"]

    @pytest.mark.unit
    async def test_dashboard_stats_counts_are_accurate(
        self,
        client: AsyncClient,
        admin_user_in_db: AdminUser,
        db_session,
    ):
        """Test that dashboard statistics reflect accurate counts."""
        # Create additional test data
        from app.models.teacher import Teacher
        from app.models.yoga_class import YogaClass
        from app.models.yoga_type import YogaType

        # Create yoga type
        yoga_type = YogaType(
            name_en="Test Type",
            name_zh="测试类型",
        )
        db_session.add(yoga_type)

        # Create teacher
        teacher = Teacher(
            name_en="Test Teacher",
            name_zh="测试老师",
        )
        db_session.add(teacher)

        # Create yoga class
        yoga_class = YogaClass(
            name_en="Test Class",
            name_zh="测试课程",
            description_en="Test class description",
            description_zh="测试课程描述",
            teacher=teacher,
            yoga_type=yoga_type,
            schedule="Mon/Wed/Fri 7:00 AM",
            schedule_type="recurring",
            capacity=10,
            duration_minutes=60,
            difficulty="beginner",
            is_active=True,
        )
        db_session.add(yoga_class)
        await db_session.flush()  # Get IDs

        # Create registrations
        for i in range(3):
            registration = Registration(
                name=f"User {i}",
                email=f"user{i}@example.com",
                class_id=yoga_class.id,
                status="confirmed",
                preferred_language="en",
            )
            db_session.add(registration)

        await db_session.commit()

        token = create_access_token({"sub": str(admin_user_in_db.id)})
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.get("/api/admin/dashboard/stats", headers=headers)

        assert response.status_code == 200
        data = response.json()

        # Should include our test data
        assert data["total_registrations"] >= 3
        assert data["total_teachers"] >= 1
        assert data["total_classes"] >= 1

    @pytest.mark.unit
    async def test_recent_registrations_limit(
        self,
        client: AsyncClient,
        admin_user_in_db: AdminUser,
        db_session,
    ):
        """Test that recent registrations are limited to 5."""
        # Create more than 5 registrations
        from app.models.teacher import Teacher
        from app.models.yoga_class import YogaClass
        from app.models.yoga_type import YogaType

        yoga_type = YogaType(name_en="Test Type", name_zh="测试类型")
        db_session.add(yoga_type)

        teacher = Teacher(name_en="Test Teacher", name_zh="测试老师")
        db_session.add(teacher)

        yoga_class = YogaClass(
            name_en="Test Class",
            name_zh="测试课程",
            description_en="Test class description",
            description_zh="测试课程描述",
            teacher=teacher,
            yoga_type=yoga_type,
            schedule="Mon/Wed/Fri 7:00 AM",
            schedule_type="recurring",
            capacity=10,
            duration_minutes=60,
            difficulty="beginner",
            is_active=True,
        )
        db_session.add(yoga_class)
        await db_session.flush()  # Get IDs

        # Create 7 registrations
        for i in range(7):
            registration = Registration(
                name=f"User {i}",
                email=f"user{i}@example.com",
                class_id=yoga_class.id,
                status="confirmed",
                preferred_language="en",
                created_at=datetime.utcnow() + timedelta(minutes=i),  # Different timestamps
            )
            db_session.add(registration)

        await db_session.commit()

        token = create_access_token({"sub": str(admin_user_in_db.id)})
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.get("/api/admin/dashboard/stats", headers=headers)

        assert response.status_code == 200
        data = response.json()

        # Should be limited to 5 recent registrations
        assert len(data["recent_registrations"]) <= 5

    @pytest.mark.unit
    async def test_status_validation_values(
        self,
        client: AsyncClient,
        admin_user_in_db: AdminUser,
        registration_in_db: Registration,
    ):
        """Test all valid status values."""
        token = create_access_token({"sub": str(admin_user_in_db.id)})
        headers = {"Authorization": f"Bearer {token}"}

        valid_statuses = ["confirmed", "waitlist", "cancelled"]

        for status in valid_statuses:
            update_data = {"status": status}

            response = await client.put(
                f"/api/admin/registrations/{registration_in_db.id}/status",
                json=update_data,
                headers=headers
            )

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == status