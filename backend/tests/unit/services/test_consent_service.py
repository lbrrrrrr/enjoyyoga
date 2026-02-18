"""Unit tests for consent service."""
import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.consent_record import ConsentRecord
from app.models.yoga_type import YogaType
from app.schemas.consent import ConsentCreate
from app.services.consent_service import ConsentService


class TestConsentService:
    """Test cases for ConsentService."""

    @pytest.mark.unit
    async def test_check_consent_not_found(
        self, db_session: AsyncSession, yoga_type_in_db: YogaType
    ):
        """Test checking consent when none exists."""
        service = ConsentService()
        result = await service.check_consent(
            "nobody@example.com", yoga_type_in_db.id, db_session
        )
        assert result is None

    @pytest.mark.unit
    async def test_check_consent_found(
        self, db_session: AsyncSession, yoga_type_in_db: YogaType
    ):
        """Test checking consent when one exists."""
        service = ConsentService()
        # Create a consent first
        data = ConsentCreate(
            email="test@example.com",
            name="Test User",
            yoga_type_id=yoga_type_in_db.id,
        )
        await service.create_consent(data, db_session)

        result = await service.check_consent(
            "test@example.com", yoga_type_in_db.id, db_session
        )
        assert result is not None
        assert result.email == "test@example.com"

    @pytest.mark.unit
    async def test_check_consent_case_insensitive(
        self, db_session: AsyncSession, yoga_type_in_db: YogaType
    ):
        """Test that consent check is case-insensitive for email."""
        service = ConsentService()
        data = ConsentCreate(
            email="Test@Example.COM",
            name="Test User",
            yoga_type_id=yoga_type_in_db.id,
        )
        await service.create_consent(data, db_session)

        result = await service.check_consent(
            "test@example.com", yoga_type_in_db.id, db_session
        )
        assert result is not None

    @pytest.mark.unit
    async def test_create_consent(
        self, db_session: AsyncSession, yoga_type_in_db: YogaType
    ):
        """Test creating a new consent record."""
        service = ConsentService()
        data = ConsentCreate(
            email="new@example.com",
            name="New User",
            yoga_type_id=yoga_type_in_db.id,
            consent_text_version="1.0",
        )
        record = await service.create_consent(data, db_session, ip_address="127.0.0.1")

        assert record.email == "new@example.com"
        assert record.name == "New User"
        assert record.yoga_type_id == yoga_type_in_db.id
        assert record.ip_address == "127.0.0.1"
        assert record.consent_text_version == "1.0"

    @pytest.mark.unit
    async def test_create_consent_normalizes_email(
        self, db_session: AsyncSession, yoga_type_in_db: YogaType
    ):
        """Test that email is normalized to lowercase and stripped."""
        service = ConsentService()
        data = ConsentCreate(
            email="  Test@EXAMPLE.com  ",
            name="Test User",
            yoga_type_id=yoga_type_in_db.id,
        )
        record = await service.create_consent(data, db_session)
        assert record.email == "test@example.com"

    @pytest.mark.unit
    async def test_create_consent_idempotent(
        self, db_session: AsyncSession, yoga_type_in_db: YogaType
    ):
        """Test that signing the same consent twice returns the existing record."""
        service = ConsentService()
        data = ConsentCreate(
            email="idempotent@example.com",
            name="Test User",
            yoga_type_id=yoga_type_in_db.id,
        )
        first = await service.create_consent(data, db_session)
        second = await service.create_consent(data, db_session)

        assert first.id == second.id

    @pytest.mark.unit
    async def test_create_consent_different_yoga_types(
        self, db_session: AsyncSession, yoga_type_in_db: YogaType
    ):
        """Test that the same email can sign consent for different yoga types."""
        # Create a second yoga type
        yoga_type_2 = YogaType(
            id=uuid.uuid4(),
            name_en="Vinyasa Yoga",
            name_zh="流瑜伽",
            description_en="Flowing yoga",
            description_zh="流畅的瑜伽",
        )
        db_session.add(yoga_type_2)
        await db_session.commit()

        service = ConsentService()
        data1 = ConsentCreate(
            email="multi@example.com",
            name="Multi User",
            yoga_type_id=yoga_type_in_db.id,
        )
        data2 = ConsentCreate(
            email="multi@example.com",
            name="Multi User",
            yoga_type_id=yoga_type_2.id,
        )
        record1 = await service.create_consent(data1, db_session)
        record2 = await service.create_consent(data2, db_session)

        assert record1.id != record2.id
        assert record1.yoga_type_id != record2.yoga_type_id

    @pytest.mark.unit
    async def test_get_all_consents_empty(self, db_session: AsyncSession):
        """Test listing consents when none exist."""
        service = ConsentService()
        result = await service.get_all_consents(db_session)
        assert result == []

    @pytest.mark.unit
    async def test_get_all_consents(
        self, db_session: AsyncSession, yoga_type_in_db: YogaType
    ):
        """Test listing all consent records."""
        service = ConsentService()
        for i in range(3):
            data = ConsentCreate(
                email=f"user{i}@example.com",
                name=f"User {i}",
                yoga_type_id=yoga_type_in_db.id,
            )
            await service.create_consent(data, db_session)

        result = await service.get_all_consents(db_session)
        assert len(result) == 3

    @pytest.mark.unit
    async def test_get_all_consents_filter_by_email(
        self, db_session: AsyncSession, yoga_type_in_db: YogaType
    ):
        """Test filtering consents by email."""
        service = ConsentService()
        for email in ["alice@example.com", "bob@example.com"]:
            data = ConsentCreate(
                email=email,
                name="User",
                yoga_type_id=yoga_type_in_db.id,
            )
            await service.create_consent(data, db_session)

        result = await service.get_all_consents(db_session, email="alice@example.com")
        assert len(result) == 1
        assert result[0].email == "alice@example.com"

    @pytest.mark.unit
    async def test_get_all_consents_filter_by_yoga_type(
        self, db_session: AsyncSession, yoga_type_in_db: YogaType
    ):
        """Test filtering consents by yoga type."""
        yoga_type_2 = YogaType(
            id=uuid.uuid4(),
            name_en="Yin Yoga",
            name_zh="阴瑜伽",
            description_en="Yin yoga",
            description_zh="阴瑜伽",
        )
        db_session.add(yoga_type_2)
        await db_session.commit()

        service = ConsentService()
        await service.create_consent(
            ConsentCreate(email="a@test.com", name="A", yoga_type_id=yoga_type_in_db.id),
            db_session,
        )
        await service.create_consent(
            ConsentCreate(email="b@test.com", name="B", yoga_type_id=yoga_type_2.id),
            db_session,
        )

        result = await service.get_all_consents(
            db_session, yoga_type_id=yoga_type_in_db.id
        )
        assert len(result) == 1
        assert result[0].email == "a@test.com"

    @pytest.mark.unit
    async def test_get_all_consents_pagination(
        self, db_session: AsyncSession, yoga_type_in_db: YogaType
    ):
        """Test pagination of consent records."""
        service = ConsentService()
        for i in range(5):
            data = ConsentCreate(
                email=f"page{i}@example.com",
                name=f"User {i}",
                yoga_type_id=yoga_type_in_db.id,
            )
            await service.create_consent(data, db_session)

        result = await service.get_all_consents(db_session, limit=2, offset=0)
        assert len(result) == 2

        result2 = await service.get_all_consents(db_session, limit=2, offset=2)
        assert len(result2) == 2

    @pytest.mark.unit
    async def test_get_consent_stats_empty(self, db_session: AsyncSession):
        """Test stats when no consents exist."""
        service = ConsentService()
        stats = await service.get_consent_stats(db_session)
        assert stats["total"] == 0

    @pytest.mark.unit
    async def test_get_consent_stats(
        self, db_session: AsyncSession, yoga_type_in_db: YogaType
    ):
        """Test consent statistics grouped by yoga type."""
        service = ConsentService()
        for i in range(3):
            data = ConsentCreate(
                email=f"stat{i}@example.com",
                name=f"User {i}",
                yoga_type_id=yoga_type_in_db.id,
            )
            await service.create_consent(data, db_session)

        stats = await service.get_consent_stats(db_session)
        assert stats["total"] == 3
        assert len(stats["by_yoga_type"]) >= 1

        yoga_type_stats = next(
            (s for s in stats["by_yoga_type"] if s["yoga_type_id"] == str(yoga_type_in_db.id)),
            None,
        )
        assert yoga_type_stats is not None
        assert yoga_type_stats["count"] == 3
        assert yoga_type_stats["name_en"] == "Hatha Yoga"
