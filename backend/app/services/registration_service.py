import json
import uuid
from datetime import date, time
from typing import Tuple, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.registration import Registration
from app.models.yoga_class import YogaClass
from app.services.schedule_parser import ScheduleParserService


class RegistrationService:
    """
    Service for handling schedule-aware registration operations.
    """

    def __init__(self):
        self.schedule_parser = ScheduleParserService()

    async def create_registration_with_schedule(
        self,
        registration_data: dict,
        db: AsyncSession
    ) -> Registration:
        """
        Create registration with schedule validation.

        Args:
            registration_data: Dictionary containing registration information:
                - class_id: UUID of the yoga class
                - name: User's name
                - email: User's email
                - phone: User's phone (optional)
                - message: User's message (optional)
                - target_date: Date user wants to attend (optional)
                - target_time: Time user wants to attend (optional)
            db: Database session

        Returns:
            Created Registration object

        Raises:
            ValueError: If schedule validation fails
        """
        class_id = registration_data.get("class_id")
        target_date = registration_data.get("target_date")
        target_time = registration_data.get("target_time")

        # Get the yoga class to validate schedule
        class_query = select(YogaClass).where(YogaClass.id == class_id)
        result = await db.execute(class_query)
        yoga_class = result.scalar_one_or_none()

        if not yoga_class:
            raise ValueError(f"Yoga class with ID {class_id} not found")

        # Validate schedule if target_date is provided
        if target_date:
            # Parse schedule data
            schedule_data = {}
            if yoga_class.schedule_data:
                try:
                    schedule_data = json.loads(yoga_class.schedule_data)
                except json.JSONDecodeError:
                    # If schedule_data is malformed, parse from schedule string
                    schedule_data = self.schedule_parser.parse_schedule_string(
                        yoga_class.schedule
                    )
            else:
                # If schedule_data is NULL, parse from schedule string
                schedule_data = self.schedule_parser.parse_schedule_string(
                    yoga_class.schedule
                )

            # Validate target date against schedule
            if not self.schedule_parser.validate_target_date(
                schedule_data, target_date, target_time
            ):
                available_dates = self.schedule_parser.get_next_available_dates(
                    schedule_data, from_date=date.today(), limit=5
                )
                available_dates_str = [
                    dt.strftime("%Y-%m-%d at %I:%M %p")
                    for dt in available_dates[:3]
                ]
                raise ValueError(
                    f"Target date {target_date} is not valid for this class schedule. "
                    f"Available dates: {', '.join(available_dates_str)}"
                )

            # Check capacity for specific date (future-proofing for sessions)
            is_available, current_count = await self.validate_registration_capacity(
                class_id, target_date, db
            )

            if not is_available:
                raise ValueError(
                    f"Class is full on {target_date}. "
                    f"Current registrations: {current_count}/{yoga_class.capacity}"
                )

        # Determine status based on pricing (either CNY or USD)
        has_cny = yoga_class.price is not None and float(yoga_class.price) > 0
        has_usd = yoga_class.price_usd is not None and float(yoga_class.price_usd) > 0
        has_price = has_cny or has_usd
        initial_status = "pending_payment" if has_price else "confirmed"

        # Create the registration
        registration = Registration(
            id=uuid.uuid4(),
            class_id=class_id,
            name=registration_data["name"],
            email=registration_data["email"],
            phone=registration_data.get("phone"),
            message=registration_data.get("message"),
            target_date=target_date,
            target_time=target_time,
            preferred_language=registration_data.get("preferred_language", "en"),
            email_notifications=registration_data.get("email_notifications", True),
            sms_notifications=registration_data.get("sms_notifications", False),
            status=initial_status
        )

        db.add(registration)
        await db.commit()
        await db.refresh(registration)

        return registration

    async def validate_registration_capacity(
        self,
        class_id: uuid.UUID,
        target_date: date,
        db: AsyncSession
    ) -> Tuple[bool, int]:
        """
        Check capacity for specific date (future-proof for sessions).

        Args:
            class_id: UUID of the yoga class
            target_date: Date to check capacity for
            db: Database session

        Returns:
            Tuple of (is_available, current_registration_count)
        """
        # Get class capacity
        class_query = select(YogaClass).where(YogaClass.id == class_id)
        result = await db.execute(class_query)
        yoga_class = result.scalar_one_or_none()

        if not yoga_class:
            return False, 0

        # Count current registrations for this date
        registration_query = select(func.count(Registration.id)).where(
            Registration.class_id == class_id,
            Registration.target_date == target_date,
            Registration.status.in_(["confirmed", "waitlist", "pending_payment"])
        )

        result = await db.execute(registration_query)
        current_count = result.scalar() or 0

        # Check if capacity is available
        is_available = current_count < yoga_class.capacity

        return is_available, current_count

    async def get_registration_by_id(
        self,
        registration_id: uuid.UUID,
        db: AsyncSession
    ) -> Optional[Registration]:
        """
        Get registration by ID.

        Args:
            registration_id: UUID of the registration
            db: Database session

        Returns:
            Registration object or None if not found
        """
        query = select(Registration).where(Registration.id == registration_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def update_registration_status(
        self,
        registration_id: uuid.UUID,
        new_status: str,
        db: AsyncSession
    ) -> Optional[Registration]:
        """
        Update registration status.

        Args:
            registration_id: UUID of the registration
            new_status: New status (confirmed, waitlist, cancelled)
            db: Database session

        Returns:
            Updated Registration object or None if not found
        """
        query = select(Registration).where(Registration.id == registration_id)
        result = await db.execute(query)
        registration = result.scalar_one_or_none()

        if not registration:
            return None

        registration.status = new_status
        await db.commit()
        await db.refresh(registration)

        return registration

    async def get_registrations_for_class_date(
        self,
        class_id: uuid.UUID,
        target_date: date,
        db: AsyncSession
    ) -> list[Registration]:
        """
        Get all registrations for a specific class and date.

        Args:
            class_id: UUID of the yoga class
            target_date: Date to get registrations for
            db: Database session

        Returns:
            List of Registration objects
        """
        query = select(Registration).where(
            Registration.class_id == class_id,
            Registration.target_date == target_date
        ).order_by(Registration.created_at)

        result = await db.execute(query)
        return list(result.scalars().all())

    async def ensure_schedule_data_exists(
        self,
        class_id: uuid.UUID,
        db: AsyncSession
    ) -> Optional[dict]:
        """
        Ensure that a class has structured schedule_data.
        If not, parse from the schedule string and update.

        Args:
            class_id: UUID of the yoga class
            db: Database session

        Returns:
            Parsed schedule data dictionary or None if class not found
        """
        query = select(YogaClass).where(YogaClass.id == class_id)
        result = await db.execute(query)
        yoga_class = result.scalar_one_or_none()

        if not yoga_class:
            return None

        # If schedule_data already exists and is valid JSON, return it
        if yoga_class.schedule_data:
            try:
                return json.loads(yoga_class.schedule_data)
            except json.JSONDecodeError:
                pass  # Continue to parse from schedule string

        # Parse from schedule string
        parsed_schedule = self.schedule_parser.parse_schedule_string(
            yoga_class.schedule
        )

        # Update the class with structured schedule data
        yoga_class.schedule_data = json.dumps(parsed_schedule)
        await db.commit()

        return parsed_schedule