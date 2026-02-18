from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.tracking_token import TrackingToken
from app.config import settings


class TrackingService:
    def _normalize_email(self, email: str) -> str:
        return email.strip().lower()

    async def get_or_create_token(self, email: str, db: AsyncSession) -> TrackingToken:
        """Get existing tracking token or create a new one for the given email."""
        normalized = self._normalize_email(email)
        query = select(TrackingToken).where(TrackingToken.email == normalized)
        result = await db.execute(query)
        token = result.scalar_one_or_none()
        if token:
            return token

        token = TrackingToken(email=normalized)
        db.add(token)
        await db.commit()
        await db.refresh(token)
        return token

    async def get_email_by_token(self, token: str, db: AsyncSession) -> str | None:
        """Look up the email associated with a tracking token."""
        query = select(TrackingToken).where(TrackingToken.token == token)
        result = await db.execute(query)
        record = result.scalar_one_or_none()
        return record.email if record else None

    def build_tracking_url(self, token: str, locale: str = "en") -> str:
        """Build the frontend tracking page URL."""
        return f"{settings.frontend_url}/{locale}/track/{token}"
