#!/usr/bin/env python3
"""
Script to set up initial admin user and notification templates.
"""
import asyncio
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.models.admin_user import AdminUser
import hashlib
from app.services.notification_service import NotificationService

async def create_admin_user(db: AsyncSession):
    """Create initial admin user if it doesn't exist."""
    # Check if any admin user exists
    from sqlalchemy import select
    query = select(AdminUser).limit(1)
    result = await db.execute(query)
    existing_admin = result.scalar_one_or_none()

    if existing_admin:
        print(f"Admin user already exists: {existing_admin.username}")
        return existing_admin

    # Create new admin user with temporary simple hash
    # TODO: Fix bcrypt integration for production
    simple_hash = hashlib.sha256("admin123".encode()).hexdigest()
    admin_user = AdminUser(
        username="admin",
        email="admin@enjoyyoga.com",
        hashed_password=simple_hash,
        role="super_admin"
    )

    db.add(admin_user)
    await db.commit()
    await db.refresh(admin_user)

    print(f"Created admin user: {admin_user.username} / admin123")
    return admin_user

async def setup():
    """Main setup function."""
    # Create database engine
    engine = create_async_engine(settings.database_url)
    SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with SessionLocal() as db:
        try:
            print("Setting up admin user...")
            admin = await create_admin_user(db)

            print("Setting up notification templates...")
            notification_service = NotificationService()
            await notification_service.create_default_templates(db)

            print("Setup completed successfully!")
            print(f"Admin login: admin / admin123")

        except Exception as e:
            print(f"Setup failed: {e}")
            await db.rollback()
            raise
        finally:
            await engine.dispose()

if __name__ == "__main__":
    asyncio.run(setup())