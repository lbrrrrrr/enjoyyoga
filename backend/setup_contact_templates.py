"""
Script to set up default contact inquiry notification templates.
Run this after creating the database tables to initialize email templates.
"""

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import engine
from app.services.notification_service import NotificationService


async def setup_contact_templates():
    """Create default notification templates for contact inquiries."""
    async with AsyncSession(engine) as db:
        notification_service = NotificationService()
        await notification_service.create_default_templates(db)
        print("✅ Contact inquiry notification templates created successfully!")


if __name__ == "__main__":
    asyncio.run(setup_contact_templates())