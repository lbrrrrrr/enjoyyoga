"""Unit tests for payment service."""
import uuid
from datetime import datetime
from decimal import Decimal

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.class_package import ClassPackage
from app.models.payment import Payment
from app.models.payment_settings import PaymentSettings
from app.models.registration import Registration
from app.models.yoga_class import YogaClass
from app.services.payment_service import PaymentService


@pytest_asyncio.fixture
async def payment_service():
    """Create PaymentService instance."""
    return PaymentService()


@pytest_asyncio.fixture
async def cny_class(db_session: AsyncSession, yoga_class_in_db: YogaClass):
    """Yoga class with CNY price only."""
    yoga_class_in_db.price = 100.0
    yoga_class_in_db.price_usd = None
    yoga_class_in_db.currency = "CNY"
    await db_session.commit()
    await db_session.refresh(yoga_class_in_db)
    return yoga_class_in_db


@pytest_asyncio.fixture
async def usd_class(db_session: AsyncSession, yoga_class_in_db: YogaClass):
    """Yoga class with USD price only."""
    yoga_class_in_db.price = None
    yoga_class_in_db.price_usd = 15.0
    yoga_class_in_db.currency = "CNY"
    await db_session.commit()
    await db_session.refresh(yoga_class_in_db)
    return yoga_class_in_db


@pytest_asyncio.fixture
async def dual_price_class(db_session: AsyncSession, yoga_class_in_db: YogaClass):
    """Yoga class with both CNY and USD prices."""
    yoga_class_in_db.price = 100.0
    yoga_class_in_db.price_usd = 15.0
    yoga_class_in_db.currency = "CNY"
    await db_session.commit()
    await db_session.refresh(yoga_class_in_db)
    return yoga_class_in_db


@pytest_asyncio.fixture
async def cny_package(db_session: AsyncSession, yoga_class_in_db: YogaClass):
    """Class package with CNY price only."""
    package = ClassPackage(
        id=uuid.uuid4(),
        class_id=yoga_class_in_db.id,
        name_en="5 Sessions",
        name_zh="5节课",
        description_en="5 session package",
        description_zh="5节课套餐",
        session_count=5,
        price=400.0,
        price_usd=None,
        currency="CNY",
        is_active=True,
    )
    db_session.add(package)
    await db_session.commit()
    await db_session.refresh(package)
    return package


@pytest_asyncio.fixture
async def dual_price_package(db_session: AsyncSession, yoga_class_in_db: YogaClass):
    """Class package with both CNY and USD prices."""
    package = ClassPackage(
        id=uuid.uuid4(),
        class_id=yoga_class_in_db.id,
        name_en="10 Sessions",
        name_zh="10节课",
        description_en="10 session package",
        description_zh="10节课套餐",
        session_count=10,
        price=800.0,
        price_usd=120.0,
        currency="CNY",
        is_active=True,
    )
    db_session.add(package)
    await db_session.commit()
    await db_session.refresh(package)
    return package


class TestReferenceNumber:
    """Tests for reference number generation."""

    @pytest.mark.unit
    def test_reference_number_format(self, payment_service: PaymentService):
        """Reference number should follow EY-YYYYMMDD-XXXX format."""
        ref = payment_service.generate_reference_number()
        assert ref.startswith("EY-")
        parts = ref.split("-")
        assert len(parts) == 3
        assert len(parts[1]) == 8  # YYYYMMDD
        assert len(parts[2]) == 4  # 4 char suffix

    @pytest.mark.unit
    def test_reference_numbers_are_unique(self, payment_service: PaymentService):
        """Multiple generated reference numbers should differ."""
        refs = {payment_service.generate_reference_number() for _ in range(50)}
        # With 4 chars from 36 possible, collisions in 50 are extremely unlikely
        assert len(refs) == 50


class TestCreatePaymentForRegistration:
    """Tests for create_payment_for_registration."""

    @pytest.mark.unit
    async def test_create_payment_cny_auto_detect(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
        registration_in_db: Registration,
        cny_class: YogaClass,
    ):
        """Auto-detect should choose wechat_qr for CNY-only class."""
        payment = await payment_service.create_payment_for_registration(
            registration_in_db, cny_class, db_session
        )
        assert payment.payment_method == "wechat_qr"
        assert payment.currency == "CNY"
        assert float(payment.amount) == 100.0
        assert payment.payment_type == "single_session"
        assert payment.status == "pending"
        assert payment.reference_number.startswith("EY-")

    @pytest.mark.unit
    async def test_create_payment_usd_auto_detect(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
        registration_in_db: Registration,
        usd_class: YogaClass,
    ):
        """Auto-detect should choose venmo_qr for USD-only class."""
        payment = await payment_service.create_payment_for_registration(
            registration_in_db, usd_class, db_session
        )
        assert payment.payment_method == "venmo_qr"
        assert payment.currency == "USD"
        assert float(payment.amount) == 15.0

    @pytest.mark.unit
    async def test_create_payment_dual_price_auto_detect_prefers_cny(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
        registration_in_db: Registration,
        dual_price_class: YogaClass,
    ):
        """Auto-detect should prefer CNY when both prices exist."""
        payment = await payment_service.create_payment_for_registration(
            registration_in_db, dual_price_class, db_session
        )
        assert payment.payment_method == "wechat_qr"
        assert payment.currency == "CNY"
        assert float(payment.amount) == 100.0

    @pytest.mark.unit
    async def test_create_payment_explicit_wechat(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
        registration_in_db: Registration,
        dual_price_class: YogaClass,
    ):
        """Explicit wechat_qr should use CNY price."""
        payment = await payment_service.create_payment_for_registration(
            registration_in_db, dual_price_class, db_session,
            payment_method="wechat_qr"
        )
        assert payment.payment_method == "wechat_qr"
        assert payment.currency == "CNY"
        assert float(payment.amount) == 100.0

    @pytest.mark.unit
    async def test_create_payment_explicit_venmo(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
        registration_in_db: Registration,
        dual_price_class: YogaClass,
    ):
        """Explicit venmo_qr should use USD price."""
        payment = await payment_service.create_payment_for_registration(
            registration_in_db, dual_price_class, db_session,
            payment_method="venmo_qr"
        )
        assert payment.payment_method == "venmo_qr"
        assert payment.currency == "USD"
        assert float(payment.amount) == 15.0

    @pytest.mark.unit
    async def test_create_payment_venmo_no_usd_price_raises(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
        registration_in_db: Registration,
        cny_class: YogaClass,
    ):
        """Venmo on a class with no USD price should raise ValueError."""
        with pytest.raises(ValueError, match="does not have a USD price"):
            await payment_service.create_payment_for_registration(
                registration_in_db, cny_class, db_session,
                payment_method="venmo_qr"
            )

    @pytest.mark.unit
    async def test_create_payment_with_cny_package(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
        registration_in_db: Registration,
        cny_class: YogaClass,
        cny_package: ClassPackage,
    ):
        """Package payment should use package price."""
        payment = await payment_service.create_payment_for_registration(
            registration_in_db, cny_class, db_session,
            package_id=cny_package.id
        )
        assert payment.payment_type == "package"
        assert float(payment.amount) == 400.0
        assert payment.currency == "CNY"
        assert payment.package_id == cny_package.id

    @pytest.mark.unit
    async def test_create_payment_with_dual_price_package_venmo(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
        registration_in_db: Registration,
        dual_price_class: YogaClass,
        dual_price_package: ClassPackage,
    ):
        """Package with venmo_qr should use package price_usd."""
        payment = await payment_service.create_payment_for_registration(
            registration_in_db, dual_price_class, db_session,
            package_id=dual_price_package.id,
            payment_method="venmo_qr"
        )
        assert payment.payment_type == "package"
        assert float(payment.amount) == 120.0
        assert payment.currency == "USD"

    @pytest.mark.unit
    async def test_create_payment_package_no_usd_raises(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
        registration_in_db: Registration,
        cny_class: YogaClass,
        cny_package: ClassPackage,
    ):
        """Venmo with a CNY-only package should raise ValueError."""
        with pytest.raises(ValueError, match="does not have a USD price"):
            await payment_service.create_payment_for_registration(
                registration_in_db, cny_class, db_session,
                package_id=cny_package.id,
                payment_method="venmo_qr"
            )

    @pytest.mark.unit
    async def test_create_payment_invalid_package_raises(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
        registration_in_db: Registration,
        cny_class: YogaClass,
    ):
        """Non-existent package should raise ValueError."""
        with pytest.raises(ValueError, match="Package not found"):
            await payment_service.create_payment_for_registration(
                registration_in_db, cny_class, db_session,
                package_id=uuid.uuid4()
            )


class TestConfirmPayment:
    """Tests for confirm_payment."""

    @pytest_asyncio.fixture
    async def pending_payment(
        self,
        db_session: AsyncSession,
        registration_in_db: Registration,
    ):
        """Create a pending payment."""
        payment = Payment(
            id=uuid.uuid4(),
            registration_id=registration_in_db.id,
            amount=100.0,
            currency="CNY",
            payment_method="wechat_qr",
            status="pending",
            reference_number=f"EY-20260216-TEST",
            payment_type="single_session",
        )
        db_session.add(payment)
        # Set registration to pending_payment
        registration_in_db.status = "pending_payment"
        await db_session.commit()
        await db_session.refresh(payment)
        return payment

    @pytest.mark.unit
    async def test_confirm_payment_success(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
        pending_payment: Payment,
        admin_user_in_db,
    ):
        """Confirming a payment should update status and registration."""
        payment = await payment_service.confirm_payment(
            pending_payment.id, admin_user_in_db.id, db_session, notes="Verified"
        )
        assert payment.status == "confirmed"
        assert payment.confirmed_by == admin_user_in_db.id
        assert payment.confirmed_at is not None
        assert payment.admin_notes == "Verified"

    @pytest.mark.unit
    async def test_confirm_payment_updates_registration(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
        pending_payment: Payment,
        admin_user_in_db,
        registration_in_db: Registration,
    ):
        """Confirming should also set registration status to confirmed."""
        await payment_service.confirm_payment(
            pending_payment.id, admin_user_in_db.id, db_session
        )
        await db_session.refresh(registration_in_db)
        assert registration_in_db.status == "confirmed"

    @pytest.mark.unit
    async def test_confirm_nonexistent_payment_raises(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
        admin_user_in_db,
    ):
        """Confirming a non-existent payment should raise."""
        with pytest.raises(ValueError, match="Payment not found"):
            await payment_service.confirm_payment(
                uuid.uuid4(), admin_user_in_db.id, db_session
            )


class TestCancelPayment:
    """Tests for cancel_payment."""

    @pytest_asyncio.fixture
    async def pending_payment(
        self,
        db_session: AsyncSession,
        registration_in_db: Registration,
    ):
        """Create a pending payment for cancellation tests."""
        payment = Payment(
            id=uuid.uuid4(),
            registration_id=registration_in_db.id,
            amount=15.0,
            currency="USD",
            payment_method="venmo_qr",
            status="pending",
            reference_number=f"EY-20260216-CANC",
            payment_type="single_session",
        )
        db_session.add(payment)
        registration_in_db.status = "pending_payment"
        await db_session.commit()
        await db_session.refresh(payment)
        return payment

    @pytest.mark.unit
    async def test_cancel_payment_success(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
        pending_payment: Payment,
    ):
        """Cancelling a payment should update status."""
        payment = await payment_service.cancel_payment(
            pending_payment.id, db_session, notes="User requested"
        )
        assert payment.status == "cancelled"
        assert payment.admin_notes == "User requested"

    @pytest.mark.unit
    async def test_cancel_payment_updates_registration(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
        pending_payment: Payment,
        registration_in_db: Registration,
    ):
        """Cancelling should also cancel the registration."""
        await payment_service.cancel_payment(pending_payment.id, db_session)
        await db_session.refresh(registration_in_db)
        assert registration_in_db.status == "cancelled"

    @pytest.mark.unit
    async def test_cancel_nonexistent_payment_raises(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
    ):
        """Cancelling a non-existent payment should raise."""
        with pytest.raises(ValueError, match="Payment not found"):
            await payment_service.cancel_payment(uuid.uuid4(), db_session)


class TestGetPaymentMethods:
    """Tests for payment retrieval methods."""

    @pytest_asyncio.fixture
    async def payment_in_db(
        self,
        db_session: AsyncSession,
        registration_in_db: Registration,
    ):
        """Create a payment in the database."""
        payment = Payment(
            id=uuid.uuid4(),
            registration_id=registration_in_db.id,
            amount=100.0,
            currency="CNY",
            payment_method="wechat_qr",
            status="pending",
            reference_number="EY-20260216-ABCD",
            payment_type="single_session",
        )
        db_session.add(payment)
        await db_session.commit()
        await db_session.refresh(payment)
        return payment

    @pytest.mark.unit
    async def test_get_payment_by_id(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
        payment_in_db: Payment,
    ):
        """Should retrieve payment by ID."""
        payment = await payment_service.get_payment_by_id(payment_in_db.id, db_session)
        assert payment is not None
        assert payment.id == payment_in_db.id

    @pytest.mark.unit
    async def test_get_payment_by_id_not_found(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
    ):
        """Should return None for non-existent ID."""
        payment = await payment_service.get_payment_by_id(uuid.uuid4(), db_session)
        assert payment is None

    @pytest.mark.unit
    async def test_get_payment_by_reference(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
        payment_in_db: Payment,
    ):
        """Should retrieve payment by reference number."""
        payment = await payment_service.get_payment_by_reference(
            "EY-20260216-ABCD", db_session
        )
        assert payment is not None
        assert payment.reference_number == "EY-20260216-ABCD"

    @pytest.mark.unit
    async def test_get_payment_by_registration(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
        payment_in_db: Payment,
        registration_in_db: Registration,
    ):
        """Should retrieve payment by registration ID."""
        payment = await payment_service.get_payment_by_registration(
            registration_in_db.id, db_session
        )
        assert payment is not None
        assert payment.registration_id == registration_in_db.id


class TestGetPaymentLists:
    """Tests for payment list retrieval."""

    @pytest_asyncio.fixture
    async def multiple_payments(
        self,
        db_session: AsyncSession,
        registration_in_db: Registration,
    ):
        """Create multiple payments with different statuses and currencies."""
        payments = []
        configs = [
            ("pending", "CNY", 100.0, "wechat_qr"),
            ("pending", "USD", 15.0, "venmo_qr"),
            ("confirmed", "CNY", 200.0, "wechat_qr"),
            ("confirmed", "USD", 30.0, "venmo_qr"),
            ("cancelled", "CNY", 50.0, "wechat_qr"),
        ]
        for i, (status, currency, amount, method) in enumerate(configs):
            payment = Payment(
                id=uuid.uuid4(),
                registration_id=None,  # avoid unique constraint
                amount=amount,
                currency=currency,
                payment_method=method,
                status=status,
                reference_number=f"EY-20260216-T{i:03d}",
                payment_type="single_session",
            )
            if status == "confirmed":
                payment.confirmed_at = datetime.utcnow()
            db_session.add(payment)
            payments.append(payment)
        await db_session.commit()
        return payments

    @pytest.mark.unit
    async def test_get_pending_payments(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
        multiple_payments,
    ):
        """Should return only pending payments."""
        pending = await payment_service.get_pending_payments(db_session)
        assert len(pending) == 2
        assert all(p.status == "pending" for p in pending)

    @pytest.mark.unit
    async def test_get_all_payments(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
        multiple_payments,
    ):
        """Should return all payments."""
        all_payments = await payment_service.get_all_payments(db_session)
        assert len(all_payments) == 5

    @pytest.mark.unit
    async def test_get_all_payments_with_status_filter(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
        multiple_payments,
    ):
        """Should filter payments by status."""
        confirmed = await payment_service.get_all_payments(db_session, status="confirmed")
        assert len(confirmed) == 2
        assert all(p.status == "confirmed" for p in confirmed)

    @pytest.mark.unit
    async def test_get_all_payments_with_limit_offset(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
        multiple_payments,
    ):
        """Should support pagination."""
        page = await payment_service.get_all_payments(db_session, limit=2, offset=0)
        assert len(page) == 2


class TestPaymentStats:
    """Tests for payment statistics."""

    @pytest_asyncio.fixture
    async def stats_payments(self, db_session: AsyncSession):
        """Create payments for stats testing."""
        configs = [
            ("pending", "CNY", 100.0),
            ("confirmed", "CNY", 200.0),
            ("confirmed", "CNY", 300.0),
            ("confirmed", "USD", 25.0),
            ("confirmed", "USD", 50.0),
            ("cancelled", "CNY", 150.0),
        ]
        for i, (status, currency, amount) in enumerate(configs):
            payment = Payment(
                id=uuid.uuid4(),
                amount=amount,
                currency=currency,
                payment_method="wechat_qr" if currency == "CNY" else "venmo_qr",
                status=status,
                reference_number=f"EY-20260216-S{i:03d}",
                payment_type="single_session",
            )
            if status == "confirmed":
                payment.confirmed_at = datetime.utcnow()
            db_session.add(payment)
        await db_session.commit()

    @pytest.mark.unit
    async def test_payment_stats_counts(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
        stats_payments,
    ):
        """Should return correct counts by status."""
        stats = await payment_service.get_payment_stats(db_session)
        assert stats["total_payments"] == 6
        assert stats["pending_payments"] == 1
        assert stats["confirmed_payments"] == 4
        assert stats["cancelled_payments"] == 1

    @pytest.mark.unit
    async def test_payment_stats_revenue(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
        stats_payments,
    ):
        """Total revenue should only include confirmed payments."""
        stats = await payment_service.get_payment_stats(db_session)
        # Confirmed: CNY 200+300=500, USD 25+50=75
        assert stats["total_revenue"] == 575.0

    @pytest.mark.unit
    async def test_payment_stats_per_currency_revenue(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
        stats_payments,
    ):
        """Should split revenue by currency."""
        stats = await payment_service.get_payment_stats(db_session)
        assert stats["total_revenue_cny"] == 500.0
        assert stats["total_revenue_usd"] == 75.0

    @pytest.mark.unit
    async def test_payment_stats_empty_db(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
    ):
        """Stats should handle empty database."""
        stats = await payment_service.get_payment_stats(db_session)
        assert stats["total_payments"] == 0
        assert stats["total_revenue"] == 0.0
        assert stats["total_revenue_cny"] == 0.0
        assert stats["total_revenue_usd"] == 0.0


class TestPackageCRUD:
    """Tests for package create/update/list."""

    @pytest.mark.unit
    async def test_create_package(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
        yoga_class_in_db: YogaClass,
    ):
        """Should create a package with all fields."""
        from app.schemas.payment import ClassPackageCreate
        data = ClassPackageCreate(
            class_id=yoga_class_in_db.id,
            name_en="5 Sessions",
            name_zh="5节课",
            session_count=5,
            price=400.0,
            price_usd=60.0,
            currency="CNY",
        )
        package = await payment_service.create_package(data, db_session)
        assert package.name_en == "5 Sessions"
        assert float(package.price) == 400.0
        assert float(package.price_usd) == 60.0
        assert package.session_count == 5

    @pytest.mark.unit
    async def test_create_package_without_usd(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
        yoga_class_in_db: YogaClass,
    ):
        """Should create a package without USD price."""
        from app.schemas.payment import ClassPackageCreate
        data = ClassPackageCreate(
            class_id=yoga_class_in_db.id,
            name_en="3 Sessions",
            name_zh="3节课",
            session_count=3,
            price=250.0,
        )
        package = await payment_service.create_package(data, db_session)
        assert package.price_usd is None

    @pytest.mark.unit
    async def test_update_package(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
        cny_package: ClassPackage,
    ):
        """Should update package fields."""
        from app.schemas.payment import ClassPackageUpdate
        update = ClassPackageUpdate(price_usd=55.0, session_count=6)
        package = await payment_service.update_package(cny_package.id, update, db_session)
        assert package is not None
        assert float(package.price_usd) == 55.0
        assert package.session_count == 6

    @pytest.mark.unit
    async def test_update_nonexistent_package(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
    ):
        """Should return None for non-existent package."""
        from app.schemas.payment import ClassPackageUpdate
        result = await payment_service.update_package(
            uuid.uuid4(), ClassPackageUpdate(price=999.0), db_session
        )
        assert result is None

    @pytest.mark.unit
    async def test_get_packages_for_class(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
        yoga_class_in_db: YogaClass,
        cny_package: ClassPackage,
        dual_price_package: ClassPackage,
    ):
        """Should return all packages for a class sorted by session_count."""
        packages = await payment_service.get_packages_for_class(
            yoga_class_in_db.id, db_session
        )
        assert len(packages) == 2
        assert packages[0].session_count <= packages[1].session_count


class TestPaymentSettings:
    """Tests for payment settings CRUD."""

    @pytest.mark.unit
    async def test_get_settings_empty(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
    ):
        """Should return None when no settings exist."""
        settings = await payment_service.get_payment_settings(db_session)
        assert settings is None

    @pytest.mark.unit
    async def test_create_settings_on_first_update(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
    ):
        """Should create settings row on first update."""
        settings = await payment_service.update_payment_settings(
            db_session,
            wechat_qr_code_url="http://example.com/wechat.png",
            payment_instructions_en="Pay via WeChat",
        )
        assert settings.wechat_qr_code_url == "http://example.com/wechat.png"
        assert settings.payment_instructions_en == "Pay via WeChat"

    @pytest.mark.unit
    async def test_update_venmo_settings(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
    ):
        """Should update Venmo-specific settings."""
        # First create
        await payment_service.update_payment_settings(
            db_session,
            wechat_qr_code_url="http://example.com/wechat.png",
        )
        # Then update with Venmo
        settings = await payment_service.update_payment_settings(
            db_session,
            venmo_qr_code_url="http://example.com/venmo.png",
            venmo_payment_instructions_en="Pay via Venmo",
            venmo_payment_instructions_zh="通过 Venmo 支付",
        )
        assert settings.venmo_qr_code_url == "http://example.com/venmo.png"
        assert settings.venmo_payment_instructions_en == "Pay via Venmo"
        assert settings.venmo_payment_instructions_zh == "通过 Venmo 支付"
        # WeChat settings should remain
        assert settings.wechat_qr_code_url == "http://example.com/wechat.png"

    @pytest.mark.unit
    async def test_partial_update_preserves_other_fields(
        self,
        payment_service: PaymentService,
        db_session: AsyncSession,
    ):
        """Updating one field should not clear others."""
        await payment_service.update_payment_settings(
            db_session,
            wechat_qr_code_url="http://example.com/wechat.png",
            venmo_qr_code_url="http://example.com/venmo.png",
        )
        # Update only instructions
        settings = await payment_service.update_payment_settings(
            db_session,
            payment_instructions_en="Updated instructions",
        )
        assert settings.wechat_qr_code_url == "http://example.com/wechat.png"
        assert settings.venmo_qr_code_url == "http://example.com/venmo.png"
        assert settings.payment_instructions_en == "Updated instructions"
