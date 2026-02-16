import uuid
import string
import random
from datetime import datetime, date
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, and_, func
from sqlalchemy.orm import selectinload

from app.models.payment import Payment
from app.models.payment_settings import PaymentSettings
from app.models.class_package import ClassPackage
from app.models.registration import Registration
from app.models.yoga_class import YogaClass
from app.schemas.payment import ClassPackageCreate, ClassPackageUpdate


class PaymentService:
    """Service for handling payment operations."""

    def generate_reference_number(self) -> str:
        """Generate a unique human-readable reference number like EY-20260215-AB3X."""
        today = date.today().strftime("%Y%m%d")
        chars = string.ascii_uppercase + string.digits
        suffix = ''.join(random.choices(chars, k=4))
        return f"EY-{today}-{suffix}"

    async def create_payment_for_registration(
        self,
        registration: Registration,
        yoga_class: YogaClass,
        db: AsyncSession,
        package_id: Optional[uuid.UUID] = None
    ) -> Payment:
        """Create a payment record for a registration."""
        # Determine amount
        if package_id:
            query = select(ClassPackage).where(ClassPackage.id == package_id)
            result = await db.execute(query)
            package = result.scalar_one_or_none()
            if not package:
                raise ValueError("Package not found")
            amount = float(package.price)
            payment_type = "package"
            currency = package.currency
        else:
            amount = float(yoga_class.price)
            payment_type = "single_session"
            currency = yoga_class.currency

        # Generate unique reference number
        reference_number = self.generate_reference_number()
        # Ensure uniqueness
        while True:
            existing = await db.execute(
                select(Payment).where(Payment.reference_number == reference_number)
            )
            if not existing.scalar_one_or_none():
                break
            reference_number = self.generate_reference_number()

        payment = Payment(
            id=uuid.uuid4(),
            registration_id=registration.id,
            amount=amount,
            currency=currency,
            payment_method="wechat_qr",
            status="pending",
            reference_number=reference_number,
            payment_type=payment_type,
            package_id=package_id,
        )

        db.add(payment)
        await db.commit()
        await db.refresh(payment)
        return payment

    async def confirm_payment(
        self,
        payment_id: uuid.UUID,
        admin_id: uuid.UUID,
        db: AsyncSession,
        notes: Optional[str] = None
    ) -> Payment:
        """Confirm a payment and update the associated registration."""
        query = select(Payment).where(Payment.id == payment_id)
        result = await db.execute(query)
        payment = result.scalar_one_or_none()

        if not payment:
            raise ValueError("Payment not found")

        payment.status = "confirmed"
        payment.confirmed_by = admin_id
        payment.confirmed_at = datetime.utcnow()
        if notes:
            payment.admin_notes = notes

        # Update associated registration status
        if payment.registration_id:
            reg_query = select(Registration).where(Registration.id == payment.registration_id)
            reg_result = await db.execute(reg_query)
            registration = reg_result.scalar_one_or_none()
            if registration:
                registration.status = "confirmed"

        await db.commit()
        await db.refresh(payment)
        return payment

    async def cancel_payment(
        self,
        payment_id: uuid.UUID,
        db: AsyncSession,
        notes: Optional[str] = None
    ) -> Payment:
        """Cancel a payment and update the associated registration."""
        query = select(Payment).where(Payment.id == payment_id)
        result = await db.execute(query)
        payment = result.scalar_one_or_none()

        if not payment:
            raise ValueError("Payment not found")

        payment.status = "cancelled"
        if notes:
            payment.admin_notes = notes

        # Update associated registration status
        if payment.registration_id:
            reg_query = select(Registration).where(Registration.id == payment.registration_id)
            reg_result = await db.execute(reg_query)
            registration = reg_result.scalar_one_or_none()
            if registration:
                registration.status = "cancelled"

        await db.commit()
        await db.refresh(payment)
        return payment

    async def get_payment_by_id(self, payment_id: uuid.UUID, db: AsyncSession) -> Optional[Payment]:
        """Get a payment by its ID."""
        query = select(Payment).where(Payment.id == payment_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def get_payment_by_reference(self, reference_number: str, db: AsyncSession) -> Optional[Payment]:
        """Get a payment by its reference number."""
        query = select(Payment).where(Payment.reference_number == reference_number)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def get_payment_by_registration(self, registration_id: uuid.UUID, db: AsyncSession) -> Optional[Payment]:
        """Get a payment by its registration ID."""
        query = select(Payment).where(Payment.registration_id == registration_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def get_pending_payments(self, db: AsyncSession) -> List[Payment]:
        """Get all pending payments."""
        query = select(Payment).where(Payment.status == "pending").order_by(desc(Payment.created_at))
        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_all_payments(
        self,
        db: AsyncSession,
        status: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Payment]:
        """Get all payments with optional filtering."""
        query = select(Payment).order_by(desc(Payment.created_at))

        if status:
            query = query.where(Payment.status == status)

        query = query.offset(offset).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_payment_stats(self, db: AsyncSession) -> dict:
        """Get payment statistics for dashboard."""
        # Count by status
        total_query = select(func.count(Payment.id))
        pending_query = select(func.count(Payment.id)).where(Payment.status == "pending")
        confirmed_query = select(func.count(Payment.id)).where(Payment.status == "confirmed")
        cancelled_query = select(func.count(Payment.id)).where(Payment.status == "cancelled")

        # Total revenue (confirmed payments only)
        revenue_query = select(func.coalesce(func.sum(Payment.amount), 0)).where(Payment.status == "confirmed")

        total = (await db.execute(total_query)).scalar() or 0
        pending = (await db.execute(pending_query)).scalar() or 0
        confirmed = (await db.execute(confirmed_query)).scalar() or 0
        cancelled = (await db.execute(cancelled_query)).scalar() or 0
        revenue = float((await db.execute(revenue_query)).scalar() or 0)

        return {
            "total_payments": total,
            "pending_payments": pending,
            "confirmed_payments": confirmed,
            "cancelled_payments": cancelled,
            "total_revenue": revenue,
        }

    # Package CRUD
    async def create_package(self, package_data: ClassPackageCreate, db: AsyncSession) -> ClassPackage:
        """Create a new class package."""
        package = ClassPackage(**package_data.model_dump())
        db.add(package)
        await db.commit()
        await db.refresh(package)
        return package

    async def update_package(
        self,
        package_id: uuid.UUID,
        update_data: ClassPackageUpdate,
        db: AsyncSession
    ) -> Optional[ClassPackage]:
        """Update an existing class package."""
        query = select(ClassPackage).where(ClassPackage.id == package_id)
        result = await db.execute(query)
        package = result.scalar_one_or_none()

        if not package:
            return None

        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(package, field, value)

        await db.commit()
        await db.refresh(package)
        return package

    async def get_packages_for_class(self, class_id: uuid.UUID, db: AsyncSession) -> List[ClassPackage]:
        """Get all packages for a class."""
        query = select(ClassPackage).where(ClassPackage.class_id == class_id).order_by(ClassPackage.session_count)
        result = await db.execute(query)
        return list(result.scalars().all())

    # Payment Settings
    async def get_payment_settings(self, db: AsyncSession) -> Optional[PaymentSettings]:
        """Get payment settings (singleton row)."""
        query = select(PaymentSettings)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def update_payment_settings(
        self,
        db: AsyncSession,
        wechat_qr_code_url: Optional[str] = None,
        payment_instructions_en: Optional[str] = None,
        payment_instructions_zh: Optional[str] = None
    ) -> PaymentSettings:
        """Update or create payment settings."""
        settings = await self.get_payment_settings(db)

        if not settings:
            settings = PaymentSettings(id=uuid.uuid4())
            db.add(settings)

        if wechat_qr_code_url is not None:
            settings.wechat_qr_code_url = wechat_qr_code_url
        if payment_instructions_en is not None:
            settings.payment_instructions_en = payment_instructions_en
        if payment_instructions_zh is not None:
            settings.payment_instructions_zh = payment_instructions_zh

        await db.commit()
        await db.refresh(settings)
        return settings
