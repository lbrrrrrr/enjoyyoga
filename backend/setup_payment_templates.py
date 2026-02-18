"""Setup payment email templates in the database."""
import asyncio
from app.database import async_session
from app.services.notification_service import NotificationService


async def setup_templates():
    """Create default templates including payment templates."""
    async with async_session() as db:
        notification_service = NotificationService()
        await notification_service.create_default_templates(db)
        print("Payment email templates created/verified successfully!")


if __name__ == "__main__":
    asyncio.run(setup_templates())
