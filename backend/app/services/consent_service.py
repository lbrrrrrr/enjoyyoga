import uuid
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, and_, func
from sqlalchemy.orm import selectinload

from app.models.consent_record import ConsentRecord
from app.models.yoga_type import YogaType
from app.schemas.consent import ConsentCreate


class ConsentService:
    """Service for handling consent/waiver operations."""

    async def check_consent(
        self, email: str, yoga_type_id: uuid.UUID, db: AsyncSession
    ) -> Optional[ConsentRecord]:
        """Check if a consent record exists for the given email and yoga type."""
        query = select(ConsentRecord).where(
            and_(
                ConsentRecord.email == email.lower().strip(),
                ConsentRecord.yoga_type_id == yoga_type_id,
            )
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def create_consent(
        self,
        consent_data: ConsentCreate,
        db: AsyncSession,
        ip_address: Optional[str] = None,
    ) -> ConsentRecord:
        """Create a consent record. Idempotent — returns existing record if already signed."""
        existing = await self.check_consent(
            consent_data.email, consent_data.yoga_type_id, db
        )
        if existing:
            return existing

        record = ConsentRecord(
            email=consent_data.email.lower().strip(),
            name=consent_data.name,
            yoga_type_id=consent_data.yoga_type_id,
            consent_text_version=consent_data.consent_text_version,
            ip_address=ip_address,
        )
        db.add(record)
        await db.commit()
        await db.refresh(record)
        return record

    async def get_all_consents(
        self,
        db: AsyncSession,
        email: Optional[str] = None,
        yoga_type_id: Optional[uuid.UUID] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[ConsentRecord]:
        """Get all consent records with optional filtering."""
        query = (
            select(ConsentRecord)
            .options(selectinload(ConsentRecord.yoga_type))
            .order_by(desc(ConsentRecord.signed_at))
        )

        conditions = []
        if email:
            conditions.append(ConsentRecord.email == email.lower().strip())
        if yoga_type_id:
            conditions.append(ConsentRecord.yoga_type_id == yoga_type_id)

        if conditions:
            query = query.where(and_(*conditions))

        query = query.offset(offset).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def get_consent_stats(self, db: AsyncSession) -> dict:
        """Get consent statistics grouped by yoga type."""
        # Total count
        total_query = select(func.count(ConsentRecord.id))
        total_result = await db.execute(total_query)
        total = total_result.scalar() or 0

        # Count by yoga type
        yoga_types_query = select(YogaType)
        yoga_types_result = await db.execute(yoga_types_query)
        yoga_types = yoga_types_result.scalars().all()

        by_yoga_type = []
        for yt in yoga_types:
            count_query = select(func.count(ConsentRecord.id)).where(
                ConsentRecord.yoga_type_id == yt.id
            )
            count_result = await db.execute(count_query)
            count = count_result.scalar() or 0
            by_yoga_type.append(
                {
                    "yoga_type_id": str(yt.id),
                    "name_en": yt.name_en,
                    "name_zh": yt.name_zh,
                    "count": count,
                }
            )

        return {
            "total": total,
            "by_yoga_type": by_yoga_type,
        }
