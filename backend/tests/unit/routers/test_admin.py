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
        assert "total_revenue" in data
        assert "total_revenue_cny" in data
        assert "total_revenue_usd" in data

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
    async def test_dashboard_stats_per_currency_revenue(
        self,
        client: AsyncClient,
        admin_user_in_db: AdminUser,
        db_session,
    ):
        """Test that dashboard stats return separate CNY and USD revenue."""
        from app.models.teacher import Teacher
        from app.models.yoga_class import YogaClass
        from app.models.yoga_type import YogaType
        from app.models.payment import Payment

        yoga_type = YogaType(name_en="Test Type", name_zh="测试类型")
        db_session.add(yoga_type)

        teacher = Teacher(name_en="Test Teacher", name_zh="测试老师")
        db_session.add(teacher)

        yoga_class = YogaClass(
            name_en="Test Class",
            name_zh="测试课程",
            description_en="Test",
            description_zh="测试",
            teacher=teacher,
            yoga_type=yoga_type,
            schedule="Mon 7:00 AM",
            schedule_type="recurring",
            capacity=10,
            duration_minutes=60,
            difficulty="beginner",
            is_active=True,
        )
        db_session.add(yoga_class)
        await db_session.flush()

        # Create registrations with payments in different currencies
        for i, (amount, currency, pay_status) in enumerate([
            (100.0, "CNY", "confirmed"),
            (200.0, "CNY", "confirmed"),
            (50.0, "USD", "confirmed"),
            (300.0, "CNY", "pending"),  # Should not count in revenue
        ]):
            reg = Registration(
                name=f"User {i}",
                email=f"user{i}@test.com",
                class_id=yoga_class.id,
                status="confirmed" if pay_status == "confirmed" else "pending_payment",
                preferred_language="en",
            )
            db_session.add(reg)
            await db_session.flush()

            payment = Payment(
                registration_id=reg.id,
                amount=amount,
                currency=currency,
                payment_method="wechat",
                status=pay_status,
                reference_number=f"EY-20260216-T{i:03d}",
            )
            db_session.add(payment)

        await db_session.commit()

        token = create_access_token({"sub": str(admin_user_in_db.id)})
        headers = {"Authorization": f"Bearer {token}"}

        response = await client.get("/api/admin/dashboard/stats", headers=headers)

        assert response.status_code == 200
        data = response.json()

        assert data["total_revenue_cny"] == 300.0  # Only confirmed CNY
        assert data["total_revenue_usd"] == 50.0   # Only confirmed USD
        assert data["total_revenue"] == 350.0       # Combined confirmed total
        assert data["pending_payments"] >= 1

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

    @pytest.mark.unit
    async def test_create_class_with_schedule_parsing(
        self,
        client: AsyncClient,
        admin_user_in_db: AdminUser,
        teacher_in_db,
        yoga_type_in_db,
        db_session,
    ):
        """Test that create_class parses schedule strings into structured data."""
        token = create_access_token({"sub": str(admin_user_in_db.id)})
        headers = {"Authorization": f"Bearer {token}"}

        class_data = {
            "name_en": "Test Class",
            "name_zh": "测试课程",
            "description_en": "Test class description",
            "description_zh": "测试课程描述",
            "teacher_id": str(teacher_in_db.id),
            "yoga_type_id": str(yoga_type_in_db.id),
            "schedule": "Mon/Wed/Fri 7:00 AM",  # Schedule string to be parsed
            "schedule_type": "recurring",
            "duration_minutes": 60,
            "difficulty": "beginner",
            "capacity": 20,
            "is_active": True
        }

        response = await client.post(
            "/api/admin/classes",
            json=class_data,
            headers=headers
        )

        assert response.status_code == 200
        data = response.json()

        # Verify the raw schedule string is saved in response
        assert data["schedule"] == "Mon/Wed/Fri 7:00 AM"

        # Check the database directly for schedule_data parsing
        from app.models.yoga_class import YogaClass
        from sqlalchemy import select
        import uuid

        class_id = uuid.UUID(data["id"])  # Convert string to UUID
        query = select(YogaClass).where(YogaClass.id == class_id)
        result = await db_session.execute(query)
        created_class = result.scalar_one()

        # Verify structured schedule data was parsed and saved to database
        assert created_class.schedule_data is not None
        import json
        schedule_data = json.loads(created_class.schedule_data)

        assert schedule_data["type"] == "weekly_recurring"
        assert schedule_data["pattern"]["days"] == ["monday", "wednesday", "friday"]
        assert schedule_data["pattern"]["time"] == "07:00"
        assert schedule_data["pattern"]["duration_minutes"] == 60

    @pytest.mark.unit
    async def test_create_class_with_duration_format_schedule(
        self,
        client: AsyncClient,
        admin_user_in_db: AdminUser,
        teacher_in_db,
        yoga_type_in_db,
        db_session,
    ):
        """Test creating class with duration format schedule."""
        token = create_access_token({"sub": str(admin_user_in_db.id)})
        headers = {"Authorization": f"Bearer {token}"}

        class_data = {
            "name_en": "Duration Test Class",
            "name_zh": "时长测试课程",
            "description_en": "Test class with duration",
            "description_zh": "带时长的测试课程",
            "teacher_id": str(teacher_in_db.id),
            "yoga_type_id": str(yoga_type_in_db.id),
            "schedule": "Wednesday 18:00 - 19:30",  # Duration format
            "schedule_type": "recurring",
            "duration_minutes": 90,
            "difficulty": "intermediate",
            "capacity": 15,
            "is_active": True
        }

        response = await client.post(
            "/api/admin/classes",
            json=class_data,
            headers=headers
        )

        assert response.status_code == 200
        data = response.json()

        # Check the database directly for schedule_data parsing
        from app.models.yoga_class import YogaClass
        from sqlalchemy import select
        import uuid

        class_id = uuid.UUID(data["id"])  # Convert string to UUID
        query = select(YogaClass).where(YogaClass.id == class_id)
        result = await db_session.execute(query)
        created_class = result.scalar_one()

        # Verify structured schedule data was parsed with correct duration
        import json
        schedule_data = json.loads(created_class.schedule_data)

        assert schedule_data["type"] == "weekly_recurring"
        assert schedule_data["pattern"]["days"] == ["wednesday"]
        assert schedule_data["pattern"]["time"] == "18:00"
        assert schedule_data["pattern"]["duration_minutes"] == 90  # Calculated from duration

    @pytest.mark.unit
    async def test_update_class_with_schedule_parsing(
        self,
        client: AsyncClient,
        admin_user_in_db: AdminUser,
        teacher_in_db,
        yoga_type_in_db,
        db_session,
    ):
        """Test that update_class parses schedule strings into structured data."""
        # Create a yoga class first
        from app.models.yoga_class import YogaClass

        yoga_class = YogaClass(
            name_en="Original Class",
            name_zh="原课程",
            description_en="Original description",
            description_zh="原描述",
            teacher_id=teacher_in_db.id,
            yoga_type_id=yoga_type_in_db.id,
            schedule="Tue/Thu 6:00 PM",
            schedule_data='{"type": "weekly_recurring"}',  # Original structured data
            schedule_type="recurring",
            duration_minutes=75,
            difficulty="advanced",
            capacity=10,
            is_active=True
        )

        db_session.add(yoga_class)
        await db_session.commit()
        await db_session.refresh(yoga_class)

        token = create_access_token({"sub": str(admin_user_in_db.id)})
        headers = {"Authorization": f"Bearer {token}"}

        update_data = {
            "name_en": "Updated Class",
            "name_zh": "更新课程",
            "description_en": "Updated description",
            "description_zh": "更新描述",
            "teacher_id": str(teacher_in_db.id),
            "yoga_type_id": str(yoga_type_in_db.id),
            "schedule": "Monday 14:30 - 16:00",  # New duration format
            "schedule_type": "recurring",
            "duration_minutes": 90,
            "difficulty": "intermediate",
            "capacity": 12,
            "is_active": True
        }

        response = await client.put(
            f"/api/admin/classes/{yoga_class.id}",
            json=update_data,
            headers=headers
        )

        assert response.status_code == 200
        data = response.json()

        # Verify the schedule was updated in response
        assert data["schedule"] == "Monday 14:30 - 16:00"

        # Check the database directly for updated schedule_data parsing
        from sqlalchemy import select
        query = select(YogaClass).where(YogaClass.id == yoga_class.id)
        result = await db_session.execute(query)
        updated_class = result.scalar_one()

        # Verify structured schedule data was re-parsed
        import json
        schedule_data = json.loads(updated_class.schedule_data)

        assert schedule_data["type"] == "weekly_recurring"
        assert schedule_data["pattern"]["days"] == ["monday"]
        assert schedule_data["pattern"]["time"] == "14:30"
        assert schedule_data["pattern"]["duration_minutes"] == 90  # Calculated duration

    @pytest.mark.unit
    async def test_create_class_with_24hour_format_schedule(
        self,
        client: AsyncClient,
        admin_user_in_db: AdminUser,
        teacher_in_db,
        yoga_type_in_db,
        db_session,
    ):
        """Test creating class with 24-hour format schedule."""
        token = create_access_token({"sub": str(admin_user_in_db.id)})
        headers = {"Authorization": f"Bearer {token}"}

        class_data = {
            "name_en": "24Hour Test Class",
            "name_zh": "24小时制测试课程",
            "description_en": "Test class with 24-hour time",
            "description_zh": "24小时制测试课程",
            "teacher_id": str(teacher_in_db.id),
            "yoga_type_id": str(yoga_type_in_db.id),
            "schedule": "Sat/Sun 19:30",  # 24-hour format
            "schedule_type": "recurring",
            "duration_minutes": 60,
            "difficulty": "beginner",
            "capacity": 25,
            "is_active": True
        }

        response = await client.post(
            "/api/admin/classes",
            json=class_data,
            headers=headers
        )

        assert response.status_code == 200
        data = response.json()

        # Check the database directly for schedule_data parsing
        from app.models.yoga_class import YogaClass
        from sqlalchemy import select
        import uuid

        class_id = uuid.UUID(data["id"])  # Convert string to UUID
        query = select(YogaClass).where(YogaClass.id == class_id)
        result = await db_session.execute(query)
        created_class = result.scalar_one()

        # Verify structured schedule data was parsed correctly
        import json
        schedule_data = json.loads(created_class.schedule_data)

        assert schedule_data["type"] == "weekly_recurring"
        assert schedule_data["pattern"]["days"] == ["saturday", "sunday"]
        assert schedule_data["pattern"]["time"] == "19:30"
        assert schedule_data["pattern"]["duration_minutes"] == 60  # Default duration

    @pytest.mark.unit
    async def test_create_class_with_invalid_schedule_format(
        self,
        client: AsyncClient,
        admin_user_in_db: AdminUser,
        teacher_in_db,
        yoga_type_in_db,
        db_session,
    ):
        """Test creating class with unparseable schedule format falls back to custom type."""
        token = create_access_token({"sub": str(admin_user_in_db.id)})
        headers = {"Authorization": f"Bearer {token}"}

        class_data = {
            "name_en": "Custom Schedule Class",
            "name_zh": "自定义时间表课程",
            "description_en": "Class with custom schedule",
            "description_zh": "自定义时间表课程",
            "teacher_id": str(teacher_in_db.id),
            "yoga_type_id": str(yoga_type_in_db.id),
            "schedule": "By appointment only",  # Unparseable format
            "schedule_type": "custom",
            "duration_minutes": 60,
            "difficulty": "all_levels",
            "capacity": 5,
            "is_active": True
        }

        response = await client.post(
            "/api/admin/classes",
            json=class_data,
            headers=headers
        )

        assert response.status_code == 200
        data = response.json()

        # Check the database directly for schedule_data parsing
        from app.models.yoga_class import YogaClass
        from sqlalchemy import select
        import uuid

        class_id = uuid.UUID(data["id"])  # Convert string to UUID
        query = select(YogaClass).where(YogaClass.id == class_id)
        result = await db_session.execute(query)
        created_class = result.scalar_one()

        # Verify it falls back to custom type
        import json
        schedule_data = json.loads(created_class.schedule_data)

        assert schedule_data["type"] == "custom"
        assert schedule_data["original_schedule"] == "by appointment only"  # lowercase

    # Session-based Authentication Tests
    @pytest.mark.unit
    async def test_admin_login_sets_session_cookies(
        self,
        client: AsyncClient,
        admin_user_in_db: AdminUser,
    ):
        """Test that admin login sets Base64 encoded session cookies."""
        from app.auth import get_password_hash
        import base64
        import json

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

        # Check response structure
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "admin" in data

        # Check that cookies are set
        cookies = response.cookies
        assert "admin_session" in cookies
        assert "admin_user" in cookies

        # Verify admin_user cookie is Base64 encoded JSON
        admin_user_cookie = cookies["admin_user"]
        decoded_json = base64.b64decode(admin_user_cookie).decode()
        admin_data = json.loads(decoded_json)

        assert admin_data["id"] == str(admin_user_in_db.id)
        assert admin_data["username"] == admin_user_in_db.username
        assert admin_data["email"] == admin_user_in_db.email
        assert admin_data["role"] == admin_user_in_db.role

        # Verify admin_session cookie is a JWT token
        admin_session_cookie = cookies["admin_session"]
        assert len(admin_session_cookie) > 50  # JWT tokens are long

        # Check that cookies have values (detailed cookie attributes testing is done in integration tests)
        assert len(admin_session_cookie) > 10  # Session token should be substantial
        assert len(admin_user_cookie) > 10  # User cookie should be substantial

    @pytest.mark.unit
    async def test_admin_logout_success(
        self,
        client: AsyncClient,
        admin_user_in_db: AdminUser,
    ):
        """Test successful admin logout with valid authentication."""
        from app.auth import create_access_token
        import base64
        import json

        admin_user_in_db.is_active = True

        # Create session token and admin cookie
        session_token = create_access_token({"sub": str(admin_user_in_db.id)})
        admin_data = {
            "id": str(admin_user_in_db.id),
            "username": admin_user_in_db.username,
            "email": admin_user_in_db.email,
            "role": admin_user_in_db.role
        }
        admin_user_base64 = base64.b64encode(json.dumps(admin_data).encode()).decode()

        # Set cookies
        client.cookies.set("admin_session", session_token)
        client.cookies.set("admin_user", admin_user_base64)

        # Perform logout
        response = await client.post("/api/admin/logout")

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Successfully logged out"

    @pytest.mark.unit
    async def test_cookie_based_authentication_success(
        self,
        client: AsyncClient,
        admin_user_in_db: AdminUser,
    ):
        """Test accessing protected endpoints with session cookies."""
        from app.auth import get_password_hash, create_access_token
        import base64
        import json

        admin_user_in_db.is_active = True

        # Create session token
        session_token = create_access_token({"sub": str(admin_user_in_db.id)})

        # Create admin user cookie data
        admin_data = {
            "id": str(admin_user_in_db.id),
            "username": admin_user_in_db.username,
            "email": admin_user_in_db.email,
            "role": admin_user_in_db.role
        }
        admin_user_base64 = base64.b64encode(json.dumps(admin_data).encode()).decode()

        # Set cookies
        client.cookies.set("admin_session", session_token)
        client.cookies.set("admin_user", admin_user_base64)

        # Test accessing protected endpoint
        response = await client.get("/api/admin/me")

        assert response.status_code == 200
        data = response.json()
        assert data["username"] == admin_user_in_db.username
        assert data["email"] == admin_user_in_db.email
        assert data["role"] == admin_user_in_db.role

    @pytest.mark.unit
    async def test_cookie_based_authentication_missing_session(
        self,
        client: AsyncClient,
    ):
        """Test accessing protected endpoints without session cookie."""
        # Don't set any cookies
        response = await client.get("/api/admin/me")

        assert response.status_code == 401
        assert "Could not validate credentials" in response.json()["detail"]

    @pytest.mark.unit
    async def test_cookie_based_authentication_invalid_session(
        self,
        client: AsyncClient,
    ):
        """Test accessing protected endpoints with invalid session token."""
        import base64
        import json

        # Set invalid session token
        client.cookies.set("admin_session", "invalid.jwt.token")

        # Set valid admin user cookie (should be ignored due to invalid session)
        admin_data = {"id": "test-id", "username": "test", "email": "test@test.com", "role": "admin"}
        admin_user_base64 = base64.b64encode(json.dumps(admin_data).encode()).decode()
        client.cookies.set("admin_user", admin_user_base64)

        response = await client.get("/api/admin/me")

        assert response.status_code == 401

    @pytest.mark.unit
    async def test_cookie_based_authentication_expired_session(
        self,
        client: AsyncClient,
        admin_user_in_db: AdminUser,
    ):
        """Test accessing protected endpoints with expired session token."""
        from app.auth import create_access_token
        from datetime import timedelta
        import base64
        import json

        admin_user_in_db.is_active = True

        # Create expired session token (expired 1 minute ago)
        expired_token = create_access_token(
            {"sub": str(admin_user_in_db.id)},
            expires_delta=timedelta(minutes=-1)
        )

        # Create admin user cookie
        admin_data = {
            "id": str(admin_user_in_db.id),
            "username": admin_user_in_db.username,
            "email": admin_user_in_db.email,
            "role": admin_user_in_db.role
        }
        admin_user_base64 = base64.b64encode(json.dumps(admin_data).encode()).decode()

        # Set cookies
        client.cookies.set("admin_session", expired_token)
        client.cookies.set("admin_user", admin_user_base64)

        response = await client.get("/api/admin/me")

        assert response.status_code == 401

    @pytest.mark.unit
    async def test_cookie_based_dashboard_stats(
        self,
        client: AsyncClient,
        admin_user_in_db: AdminUser,
        registration_in_db: Registration,
    ):
        """Test dashboard stats endpoint with cookie authentication."""
        from app.auth import create_access_token
        import base64
        import json

        admin_user_in_db.is_active = True

        # Create session token and admin cookie
        session_token = create_access_token({"sub": str(admin_user_in_db.id)})
        admin_data = {
            "id": str(admin_user_in_db.id),
            "username": admin_user_in_db.username,
            "email": admin_user_in_db.email,
            "role": admin_user_in_db.role
        }
        admin_user_base64 = base64.b64encode(json.dumps(admin_data).encode()).decode()

        # Set cookies
        client.cookies.set("admin_session", session_token)
        client.cookies.set("admin_user", admin_user_base64)

        response = await client.get("/api/admin/dashboard/stats")

        assert response.status_code == 200
        data = response.json()

        assert "total_registrations" in data
        assert "total_teachers" in data
        assert "total_classes" in data
        assert "recent_registrations" in data

    @pytest.mark.unit
    async def test_test_cookies_endpoint(
        self,
        client: AsyncClient,
    ):
        """Test the debug test-cookies endpoint."""
        import base64
        import json

        # Set test cookies
        session_token = "test.jwt.token"
        admin_data = {"id": "test-id", "username": "testuser", "email": "test@test.com", "role": "admin"}
        admin_user_base64 = base64.b64encode(json.dumps(admin_data).encode()).decode()

        client.cookies.set("admin_session", session_token)
        client.cookies.set("admin_user", admin_user_base64)

        response = await client.get("/api/admin/test-cookies")

        assert response.status_code == 200
        data = response.json()

        assert data["message"] == "Cookie test endpoint"
        assert "cookies_received" in data
        assert data["admin_session"] == session_token
        assert data["admin_user"] == admin_user_base64

    @pytest.mark.unit
    async def test_test_cookies_endpoint_no_cookies(
        self,
        client: AsyncClient,
    ):
        """Test the test-cookies endpoint with no cookies."""
        response = await client.get("/api/admin/test-cookies")

        assert response.status_code == 200
        data = response.json()

        assert data["message"] == "Cookie test endpoint"
        assert data["admin_session"] == "NOT FOUND"
        assert data["admin_user"] == "NOT FOUND"

    @pytest.mark.unit
    async def test_test_login_endpoint(
        self,
        client: AsyncClient,
    ):
        """Test the debug test-login endpoint sets Base64 cookies."""
        import base64
        import json

        response = await client.post("/api/admin/test-login")

        assert response.status_code == 200
        data = response.json()

        assert data["message"] == "Test cookies set"
        assert "original_json" in data
        assert "base64_value" in data

        # Verify JSON structure
        original_json = json.loads(data["original_json"])
        assert original_json["id"] == "test-id-123"
        assert original_json["username"] == "test-admin"
        assert original_json["email"] == "test@example.com"
        assert original_json["role"] == "admin"

        # Verify Base64 encoding
        expected_base64 = base64.b64encode(data["original_json"].encode()).decode()
        assert data["base64_value"] == expected_base64

        # Verify cookie was set
        cookies = response.cookies
        assert "admin_user" in cookies
        assert cookies["admin_user"] == expected_base64

    @pytest.mark.unit
    async def test_admin_login_cookie_security_settings(
        self,
        client: AsyncClient,
        admin_user_in_db: AdminUser,
    ):
        """Test that login sets cookies with proper security settings for development."""
        from app.auth import get_password_hash

        password = "test_password"
        admin_user_in_db.hashed_password = get_password_hash(password)
        admin_user_in_db.is_active = True

        login_data = {
            "username": admin_user_in_db.username,
            "password": password,
        }

        response = await client.post("/api/admin/login", json=login_data)

        assert response.status_code == 200

        cookies = response.cookies

        # Check that both required cookies are set
        assert "admin_session" in cookies
        assert "admin_user" in cookies

        # Verify cookies have values
        assert len(cookies["admin_session"]) > 10
        assert len(cookies["admin_user"]) > 10

    @pytest.mark.unit
    async def test_session_token_expiration_30_minutes(
        self,
        client: AsyncClient,
        admin_user_in_db: AdminUser,
    ):
        """Test that session tokens are set to expire in 30 minutes."""
        from app.auth import get_password_hash
        from jose import jwt
        from app.config import settings
        import time

        password = "test_password"
        admin_user_in_db.hashed_password = get_password_hash(password)
        admin_user_in_db.is_active = True

        login_data = {
            "username": admin_user_in_db.username,
            "password": password,
        }

        # Record login time
        login_time = int(time.time())

        response = await client.post("/api/admin/login", json=login_data)
        assert response.status_code == 200

        # Decode the JWT token to check expiration
        session_token = response.cookies["admin_session"]
        payload = jwt.decode(session_token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])

        # Check that token expires in approximately 30 minutes (allow 60 second tolerance)
        expected_exp = login_time + (30 * 60)  # 30 minutes
        actual_exp = payload["exp"]

        assert abs(actual_exp - expected_exp) < 60  # Within 60 seconds tolerance

    @pytest.mark.unit
    async def test_logout_requires_authentication(
        self,
        client: AsyncClient,
    ):
        """Test that logout endpoint requires valid authentication."""
        # Try to logout without cookies
        response = await client.post("/api/admin/logout")

        assert response.status_code == 401
        assert "Could not validate credentials" in response.json()["detail"]