"""Unit tests for payment router endpoints."""
import uuid
from datetime import datetime
from unittest.mock import patch

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import create_access_token
from app.models.admin_user import AdminUser
from app.models.class_package import ClassPackage
from app.models.payment import Payment
from app.models.payment_settings import PaymentSettings
from app.models.registration import Registration
from app.models.yoga_class import YogaClass


@pytest_asyncio.fixture
async def auth_headers(admin_user_in_db: AdminUser):
    """Auth headers for admin endpoints."""
    token = create_access_token({"sub": str(admin_user_in_db.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def payment_settings_in_db(db_session: AsyncSession):
    """Create payment settings with both WeChat and Venmo QR codes."""
    settings = PaymentSettings(
        id=uuid.uuid4(),
        wechat_qr_code_url="http://test.com/wechat_qr.png",
        payment_instructions_en="Pay via WeChat",
        payment_instructions_zh="通过微信支付",
        venmo_qr_code_url="http://test.com/venmo_qr.png",
        venmo_payment_instructions_en="Pay via Venmo",
        venmo_payment_instructions_zh="通过 Venmo 支付",
    )
    db_session.add(settings)
    await db_session.commit()
    await db_session.refresh(settings)
    return settings


@pytest_asyncio.fixture
async def wechat_payment(
    db_session: AsyncSession,
    registration_in_db: Registration,
):
    """Create a pending WeChat payment."""
    payment = Payment(
        id=uuid.uuid4(),
        registration_id=registration_in_db.id,
        amount=100.0,
        currency="CNY",
        payment_method="wechat_qr",
        status="pending",
        reference_number="EY-20260216-WC01",
        payment_type="single_session",
    )
    db_session.add(payment)
    await db_session.commit()
    await db_session.refresh(payment)
    return payment


@pytest_asyncio.fixture
async def venmo_payment(db_session: AsyncSession):
    """Create a pending Venmo payment (no registration)."""
    payment = Payment(
        id=uuid.uuid4(),
        amount=15.0,
        currency="USD",
        payment_method="venmo_qr",
        status="pending",
        reference_number="EY-20260216-VM01",
        payment_type="single_session",
    )
    db_session.add(payment)
    await db_session.commit()
    await db_session.refresh(payment)
    return payment


@pytest_asyncio.fixture
async def confirmed_cny_payment(db_session: AsyncSession, admin_user_in_db: AdminUser):
    """Create a confirmed CNY payment."""
    payment = Payment(
        id=uuid.uuid4(),
        amount=200.0,
        currency="CNY",
        payment_method="wechat_qr",
        status="confirmed",
        reference_number="EY-20260216-CC01",
        payment_type="single_session",
        confirmed_by=admin_user_in_db.id,
        confirmed_at=datetime.utcnow(),
    )
    db_session.add(payment)
    await db_session.commit()
    await db_session.refresh(payment)
    return payment


@pytest_asyncio.fixture
async def confirmed_usd_payment(db_session: AsyncSession, admin_user_in_db: AdminUser):
    """Create a confirmed USD payment."""
    payment = Payment(
        id=uuid.uuid4(),
        amount=25.0,
        currency="USD",
        payment_method="venmo_qr",
        status="confirmed",
        reference_number="EY-20260216-CU01",
        payment_type="single_session",
        confirmed_by=admin_user_in_db.id,
        confirmed_at=datetime.utcnow(),
    )
    db_session.add(payment)
    await db_session.commit()
    await db_session.refresh(payment)
    return payment


class TestPublicPaymentStatus:
    """Tests for GET /api/payments/status/{reference_number}."""

    @pytest.mark.unit
    async def test_get_payment_status_wechat(
        self,
        client: AsyncClient,
        wechat_payment: Payment,
        payment_settings_in_db: PaymentSettings,
    ):
        """Should return payment info with WeChat settings."""
        response = await client.get(
            f"/api/payments/status/{wechat_payment.reference_number}"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["reference_number"] == "EY-20260216-WC01"
        assert data["amount"] == 100.0
        assert data["currency"] == "CNY"
        assert data["payment_method"] == "wechat_qr"
        assert data["status"] == "pending"
        assert data["wechat_qr_code_url"] == "http://test.com/wechat_qr.png"
        assert data["payment_instructions_en"] == "Pay via WeChat"

    @pytest.mark.unit
    async def test_get_payment_status_venmo(
        self,
        client: AsyncClient,
        venmo_payment: Payment,
        payment_settings_in_db: PaymentSettings,
    ):
        """Should return payment info with Venmo settings."""
        response = await client.get(
            f"/api/payments/status/{venmo_payment.reference_number}"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["payment_method"] == "venmo_qr"
        assert data["currency"] == "USD"
        assert data["venmo_qr_code_url"] == "http://test.com/venmo_qr.png"
        assert data["venmo_payment_instructions_en"] == "Pay via Venmo"

    @pytest.mark.unit
    async def test_get_payment_status_not_found(self, client: AsyncClient):
        """Should return 404 for non-existent reference."""
        response = await client.get("/api/payments/status/EY-99999999-ZZZZ")
        assert response.status_code == 404

    @pytest.mark.unit
    async def test_get_payment_status_no_settings(
        self,
        client: AsyncClient,
        wechat_payment: Payment,
    ):
        """Should return null QR URLs when settings are not configured."""
        response = await client.get(
            f"/api/payments/status/{wechat_payment.reference_number}"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["wechat_qr_code_url"] is None
        assert data["venmo_qr_code_url"] is None


class TestPublicPaymentSettings:
    """Tests for GET /api/payments/settings."""

    @pytest.mark.unit
    async def test_get_settings(
        self,
        client: AsyncClient,
        payment_settings_in_db: PaymentSettings,
    ):
        """Should return payment settings with Venmo fields."""
        response = await client.get("/api/payments/settings")
        assert response.status_code == 200
        data = response.json()
        assert data["wechat_qr_code_url"] == "http://test.com/wechat_qr.png"
        assert data["venmo_qr_code_url"] == "http://test.com/venmo_qr.png"
        assert data["venmo_payment_instructions_en"] == "Pay via Venmo"
        assert data["venmo_payment_instructions_zh"] == "通过 Venmo 支付"

    @pytest.mark.unit
    async def test_get_settings_not_configured(self, client: AsyncClient):
        """Should return 404 when no settings exist."""
        response = await client.get("/api/payments/settings")
        assert response.status_code == 404


class TestPublicPaymentByRegistration:
    """Tests for GET /api/payments/registration/{registration_id}."""

    @pytest.mark.unit
    async def test_get_payment_by_registration(
        self,
        client: AsyncClient,
        wechat_payment: Payment,
        registration_in_db: Registration,
        payment_settings_in_db: PaymentSettings,
    ):
        """Should return payment info for a registration."""
        response = await client.get(
            f"/api/payments/registration/{registration_in_db.id}"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["reference_number"] == "EY-20260216-WC01"
        assert data["payment_method"] == "wechat_qr"

    @pytest.mark.unit
    async def test_get_payment_by_registration_not_found(self, client: AsyncClient):
        """Should return 404 for registration without payment."""
        response = await client.get(f"/api/payments/registration/{uuid.uuid4()}")
        assert response.status_code == 404


class TestAdminListPayments:
    """Tests for GET /api/admin/payments."""

    @pytest.mark.unit
    async def test_list_payments_requires_auth(self, client: AsyncClient):
        """Should return 401 without auth."""
        response = await client.get("/api/admin/payments")
        assert response.status_code == 401

    @pytest.mark.unit
    async def test_list_all_payments(
        self,
        client: AsyncClient,
        auth_headers: dict,
        wechat_payment: Payment,
        venmo_payment: Payment,
    ):
        """Should return all payments."""
        response = await client.get("/api/admin/payments", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    @pytest.mark.unit
    async def test_list_payments_filter_by_status(
        self,
        client: AsyncClient,
        auth_headers: dict,
        wechat_payment: Payment,
        confirmed_cny_payment: Payment,
    ):
        """Should filter by status."""
        response = await client.get(
            "/api/admin/payments?status=confirmed", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["status"] == "confirmed"


class TestAdminPendingPayments:
    """Tests for GET /api/admin/payments/pending."""

    @pytest.mark.unit
    async def test_list_pending_payments(
        self,
        client: AsyncClient,
        auth_headers: dict,
        wechat_payment: Payment,
        venmo_payment: Payment,
        confirmed_cny_payment: Payment,
    ):
        """Should only return pending payments."""
        response = await client.get("/api/admin/payments/pending", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert all(p["status"] == "pending" for p in data)


class TestAdminPaymentStats:
    """Tests for GET /api/admin/payments/stats."""

    @pytest.mark.unit
    async def test_payment_stats_with_dual_currency(
        self,
        client: AsyncClient,
        auth_headers: dict,
        wechat_payment: Payment,
        venmo_payment: Payment,
        confirmed_cny_payment: Payment,
        confirmed_usd_payment: Payment,
    ):
        """Should return per-currency revenue stats."""
        response = await client.get("/api/admin/payments/stats", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total_payments"] == 4
        assert data["pending_payments"] == 2
        assert data["confirmed_payments"] == 2
        assert data["total_revenue_cny"] == 200.0
        assert data["total_revenue_usd"] == 25.0
        assert data["total_revenue"] == 225.0

    @pytest.mark.unit
    async def test_payment_stats_empty(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ):
        """Should return zeros when no payments exist."""
        response = await client.get("/api/admin/payments/stats", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total_payments"] == 0
        assert data["total_revenue_cny"] == 0.0
        assert data["total_revenue_usd"] == 0.0


class TestAdminPaymentDetail:
    """Tests for GET /api/admin/payments/{payment_id}."""

    @pytest.mark.unit
    async def test_get_payment_detail(
        self,
        client: AsyncClient,
        auth_headers: dict,
        venmo_payment: Payment,
    ):
        """Should return payment details with payment_method."""
        response = await client.get(
            f"/api/admin/payments/{venmo_payment.id}", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["payment_method"] == "venmo_qr"
        assert data["currency"] == "USD"
        assert data["amount"] == 15.0

    @pytest.mark.unit
    async def test_get_payment_detail_not_found(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ):
        """Should return 404 for non-existent payment."""
        response = await client.get(
            f"/api/admin/payments/{uuid.uuid4()}", headers=auth_headers
        )
        assert response.status_code == 404


class TestAdminConfirmPayment:
    """Tests for POST /api/admin/payments/{payment_id}/confirm."""

    @pytest.mark.unit
    async def test_confirm_wechat_payment(
        self,
        client: AsyncClient,
        auth_headers: dict,
        wechat_payment: Payment,
    ):
        """Should confirm a WeChat payment."""
        response = await client.post(
            f"/api/admin/payments/{wechat_payment.id}/confirm",
            headers=auth_headers,
            json={"admin_notes": "Verified in WeChat"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "confirmed"
        assert data["admin_notes"] == "Verified in WeChat"
        assert data["confirmed_at"] is not None

    @pytest.mark.unit
    async def test_confirm_venmo_payment(
        self,
        client: AsyncClient,
        auth_headers: dict,
        venmo_payment: Payment,
    ):
        """Should confirm a Venmo payment."""
        response = await client.post(
            f"/api/admin/payments/{venmo_payment.id}/confirm",
            headers=auth_headers,
            json={"admin_notes": "Verified in Venmo"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "confirmed"
        assert data["payment_method"] == "venmo_qr"

    @pytest.mark.unit
    async def test_confirm_payment_not_found(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ):
        """Should return 404 for non-existent payment."""
        response = await client.post(
            f"/api/admin/payments/{uuid.uuid4()}/confirm",
            headers=auth_headers,
            json={},
        )
        assert response.status_code == 404


class TestAdminCancelPayment:
    """Tests for POST /api/admin/payments/{payment_id}/cancel."""

    @pytest.mark.unit
    async def test_cancel_payment(
        self,
        client: AsyncClient,
        auth_headers: dict,
        venmo_payment: Payment,
    ):
        """Should cancel a Venmo payment."""
        response = await client.post(
            f"/api/admin/payments/{venmo_payment.id}/cancel",
            headers=auth_headers,
            json={"admin_notes": "Duplicate payment"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "cancelled"
        assert data["admin_notes"] == "Duplicate payment"


class TestAdminPackages:
    """Tests for package CRUD endpoints."""

    @pytest_asyncio.fixture
    async def package_in_db(
        self,
        db_session: AsyncSession,
        yoga_class_in_db: YogaClass,
    ):
        """Create a package in the database."""
        package = ClassPackage(
            id=uuid.uuid4(),
            class_id=yoga_class_in_db.id,
            name_en="5 Sessions",
            name_zh="5节课",
            description_en="",
            description_zh="",
            session_count=5,
            price=400.0,
            price_usd=60.0,
            currency="CNY",
            is_active=True,
        )
        db_session.add(package)
        await db_session.commit()
        await db_session.refresh(package)
        return package

    @pytest.mark.unit
    async def test_list_packages(
        self,
        client: AsyncClient,
        auth_headers: dict,
        yoga_class_in_db: YogaClass,
        package_in_db: ClassPackage,
    ):
        """Should list packages for a class."""
        response = await client.get(
            f"/api/admin/packages/{yoga_class_in_db.id}", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["price_usd"] == 60.0

    @pytest.mark.unit
    async def test_create_package_with_dual_pricing(
        self,
        client: AsyncClient,
        auth_headers: dict,
        yoga_class_in_db: YogaClass,
    ):
        """Should create a package with both CNY and USD prices."""
        response = await client.post(
            "/api/admin/packages",
            headers=auth_headers,
            json={
                "class_id": str(yoga_class_in_db.id),
                "name_en": "10 Sessions",
                "name_zh": "10节课",
                "session_count": 10,
                "price": 800.0,
                "price_usd": 120.0,
                "currency": "CNY",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["price"] == 800.0
        assert data["price_usd"] == 120.0
        assert data["session_count"] == 10

    @pytest.mark.unit
    async def test_update_package_add_usd_price(
        self,
        client: AsyncClient,
        auth_headers: dict,
        package_in_db: ClassPackage,
    ):
        """Should update a package to add/change USD price."""
        response = await client.put(
            f"/api/admin/packages/{package_in_db.id}",
            headers=auth_headers,
            json={"price_usd": 55.0},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["price_usd"] == 55.0

    @pytest.mark.unit
    async def test_update_nonexistent_package(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ):
        """Should return 404 for non-existent package."""
        response = await client.put(
            f"/api/admin/packages/{uuid.uuid4()}",
            headers=auth_headers,
            json={"price": 999.0},
        )
        assert response.status_code == 404


class TestAdminPaymentSettings:
    """Tests for admin payment settings endpoints."""

    @pytest.mark.unit
    async def test_get_settings_creates_default(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ):
        """Should create default settings if none exist."""
        response = await client.get(
            "/api/admin/payment-settings", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["wechat_qr_code_url"] is None
        assert data["venmo_qr_code_url"] is None

    @pytest.mark.unit
    async def test_get_existing_settings(
        self,
        client: AsyncClient,
        auth_headers: dict,
        payment_settings_in_db: PaymentSettings,
    ):
        """Should return existing settings with Venmo fields."""
        response = await client.get(
            "/api/admin/payment-settings", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["venmo_qr_code_url"] == "http://test.com/venmo_qr.png"
        assert data["venmo_payment_instructions_en"] == "Pay via Venmo"

    @pytest.mark.unit
    async def test_update_settings_venmo_instructions(
        self,
        client: AsyncClient,
        auth_headers: dict,
        payment_settings_in_db: PaymentSettings,
    ):
        """Should update Venmo instructions."""
        response = await client.put(
            "/api/admin/payment-settings",
            headers=auth_headers,
            json={
                "venmo_payment_instructions_en": "Updated Venmo instructions",
                "venmo_payment_instructions_zh": "更新的 Venmo 说明",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["venmo_payment_instructions_en"] == "Updated Venmo instructions"
        # WeChat instructions should remain unchanged
        assert data["payment_instructions_en"] == "Pay via WeChat"

    @pytest.mark.unit
    async def test_upload_wechat_qr_code(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ):
        """Should accept image upload for WeChat QR code."""
        response = await client.post(
            "/api/admin/payment-settings/qr-code",
            headers=auth_headers,
            files={"file": ("test.png", b"fake image data", "image/png")},
        )
        assert response.status_code == 200
        data = response.json()
        assert "qr_code_url" in data
        assert "wechat_qr" in data["qr_code_url"]

    @pytest.mark.unit
    async def test_upload_venmo_qr_code(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ):
        """Should accept image upload for Venmo QR code."""
        response = await client.post(
            "/api/admin/payment-settings/venmo-qr-code",
            headers=auth_headers,
            files={"file": ("venmo.png", b"fake venmo qr", "image/png")},
        )
        assert response.status_code == 200
        data = response.json()
        assert "qr_code_url" in data
        assert "venmo_qr" in data["qr_code_url"]

    @pytest.mark.unit
    async def test_upload_qr_rejects_non_image(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ):
        """Should reject non-image files for WeChat QR."""
        response = await client.post(
            "/api/admin/payment-settings/qr-code",
            headers=auth_headers,
            files={"file": ("test.pdf", b"fake pdf", "application/pdf")},
        )
        assert response.status_code == 400
        assert "image" in response.json()["detail"].lower()

    @pytest.mark.unit
    async def test_upload_venmo_qr_rejects_non_image(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ):
        """Should reject non-image files for Venmo QR."""
        response = await client.post(
            "/api/admin/payment-settings/venmo-qr-code",
            headers=auth_headers,
            files={"file": ("test.txt", b"text file", "text/plain")},
        )
        assert response.status_code == 400
        assert "image" in response.json()["detail"].lower()

    @pytest.mark.unit
    async def test_upload_qr_requires_auth(self, client: AsyncClient):
        """QR upload endpoints should require authentication."""
        response = await client.post(
            "/api/admin/payment-settings/qr-code",
            files={"file": ("test.png", b"data", "image/png")},
        )
        assert response.status_code == 401

        response = await client.post(
            "/api/admin/payment-settings/venmo-qr-code",
            files={"file": ("test.png", b"data", "image/png")},
        )
        assert response.status_code == 401
