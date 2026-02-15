"""Unit tests for NotificationService."""
import json
from datetime import date, time
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification_template import NotificationTemplate
from app.models.registration import Registration
from app.services.notification_service import NotificationService


class TestNotificationService:
    """Test cases for NotificationService."""

    @pytest.mark.unit
    async def test_send_confirmation_email_success(
        self,
        db_session: AsyncSession,
        registration_in_db: Registration,
        notification_template_in_db: NotificationTemplate,
        mock_settings,
    ):
        """Test successful email confirmation sending."""
        service = NotificationService()

        with patch.object(service, '_send_smtp_email') as mock_smtp:
            mock_smtp.return_value = True

            result = await service.send_confirmation_email(
                registration_in_db, db_session
            )

            assert result is True
            mock_smtp.assert_called_once()

            # Verify email was marked as sent
            await db_session.refresh(registration_in_db)
            assert registration_in_db.email_confirmation_sent is True

    @pytest.mark.unit
    async def test_send_confirmation_email_no_template(
        self,
        db_session: AsyncSession,
        registration_in_db: Registration,
        mock_settings,
    ):
        """Test email confirmation when no template exists."""
        service = NotificationService()

        result = await service.send_confirmation_email(
            registration_in_db, db_session
        )

        assert result is False

        # Verify email was not marked as sent
        await db_session.refresh(registration_in_db)
        assert registration_in_db.email_confirmation_sent is False

    @pytest.mark.unit
    async def test_send_confirmation_email_smtp_failure(
        self,
        db_session: AsyncSession,
        registration_in_db: Registration,
        notification_template_in_db: NotificationTemplate,
        mock_settings,
    ):
        """Test email confirmation when SMTP fails."""
        service = NotificationService()

        with patch.object(service, '_send_smtp_email') as mock_smtp:
            mock_smtp.return_value = False

            result = await service.send_confirmation_email(
                registration_in_db, db_session
            )

            assert result is False

            # Verify email was not marked as sent
            await db_session.refresh(registration_in_db)
            assert registration_in_db.email_confirmation_sent is False

    @pytest.mark.unit
    async def test_send_confirmation_email_english_template(
        self,
        db_session: AsyncSession,
        registration_in_db: Registration,
        mock_settings,
    ):
        """Test email confirmation uses English template for English preference."""
        # Update registration with English preference
        registration_in_db.preferred_language = "en"
        registration_in_db.email_confirmation_sent = False

        # Create template
        template = NotificationTemplate(
            template_type="registration_confirmation",
            channel="email",
            subject_en="Registration Confirmed",
            subject_zh="注册确认",
            content_en="Dear {{{name}}}, your registration is confirmed.",
            content_zh="亲爱的 {{{name}}}，您的注册已确认。",
            variables=json.dumps(["name"]),
            is_active=True,
        )
        db_session.add(template)
        await db_session.commit()

        service = NotificationService()

        with patch.object(service, '_send_smtp_email') as mock_smtp:
            mock_smtp.return_value = True

            await service.send_confirmation_email(registration_in_db, db_session)

            # Verify English content was used
            mock_smtp.assert_called_once()
            call_kwargs = mock_smtp.call_args.kwargs
            assert call_kwargs["to_email"] == registration_in_db.email
            assert call_kwargs["subject"] == "Registration Confirmed"
            assert "Dear {John Doe}" in call_kwargs["content"]

    @pytest.mark.unit
    async def test_send_confirmation_email_chinese_template(
        self,
        db_session: AsyncSession,
        registration_in_db: Registration,
        mock_settings,
    ):
        """Test email confirmation uses Chinese template for Chinese preference."""
        # Update registration with Chinese preference
        registration_in_db.name = "张三"
        registration_in_db.email = "zhang@example.com"
        registration_in_db.preferred_language = "zh"
        registration_in_db.email_confirmation_sent = False

        # Create template
        template = NotificationTemplate(
            template_type="registration_confirmation",
            channel="email",
            subject_en="Registration Confirmed",
            subject_zh="注册确认",
            content_en="Dear {{{name}}}, your registration is confirmed.",
            content_zh="亲爱的 {{{name}}}，您的注册已确认。",
            variables=json.dumps(["name"]),
            is_active=True,
        )
        db_session.add(template)
        await db_session.commit()

        service = NotificationService()

        with patch.object(service, '_send_smtp_email') as mock_smtp:
            mock_smtp.return_value = True

            await service.send_confirmation_email(registration_in_db, db_session)

            # Verify Chinese content was used
            mock_smtp.assert_called_once()
            call_kwargs = mock_smtp.call_args.kwargs
            assert call_kwargs["to_email"] == registration_in_db.email
            assert call_kwargs["subject"] == "注册确认"
            assert "亲爱的 {张三}" in call_kwargs["content"]

    @pytest.mark.unit
    async def test_send_smtp_email_with_smtp_config(self, mock_settings):
        """Test SMTP email sending with proper configuration."""
        # Configure SMTP settings
        mock_settings.SMTP_SERVER = "smtp.example.com"
        mock_settings.SMTP_PORT = 587
        mock_settings.SMTP_USERNAME = "user@example.com"
        mock_settings.SMTP_PASSWORD = "password"
        mock_settings.SMTP_USE_TLS = True
        mock_settings.FROM_EMAIL = "noreply@example.com"

        service = NotificationService()

        with patch('aiosmtplib.SMTP') as mock_smtp_class:
            mock_smtp = AsyncMock()
            mock_smtp_class.return_value = mock_smtp
            mock_smtp.connect = AsyncMock()
            mock_smtp.starttls = AsyncMock()
            mock_smtp.login = AsyncMock()
            mock_smtp.send_message = AsyncMock()
            mock_smtp.quit = AsyncMock()

            result = await service._send_smtp_email(
                "test@example.com",
                "Test Subject",
                "Test Content"
            )

            assert result is True
            mock_smtp.connect.assert_called_once()
            mock_smtp.starttls.assert_called_once()
            mock_smtp.login.assert_called_once_with("user@example.com", "password")
            mock_smtp.send_message.assert_called_once()
            mock_smtp.quit.assert_called_once()

    @pytest.mark.unit
    async def test_send_smtp_email_fallback_to_console(self, mock_settings, capfd):
        """Test SMTP email falls back to console output when SMTP not configured."""
        # No SMTP configuration
        mock_settings.SMTP_SERVER = None

        service = NotificationService()

        result = await service._send_smtp_email(
            "test@example.com",
            "Test Subject",
            "Test Content"
        )

        assert result is True

        # Verify console output
        captured = capfd.readouterr()
        assert "EMAIL (Development Mode)" in captured.out
        assert "To: test@example.com" in captured.out
        assert "Subject: Test Subject" in captured.out
        assert "Test Content" in captured.out

    @pytest.mark.unit
    async def test_send_smtp_email_connection_error(self, mock_settings):
        """Test SMTP email handling connection errors."""
        mock_settings.SMTP_SERVER = "smtp.example.com"
        mock_settings.SMTP_PORT = 587

        service = NotificationService()

        with patch('aiosmtplib.SMTP') as mock_smtp_class:
            mock_smtp_class.side_effect = Exception("Connection failed")

            result = await service._send_smtp_email(
                "test@example.com",
                "Test Subject",
                "Test Content"
            )

            assert result is False

    @pytest.mark.unit
    async def test_get_template_success(
        self,
        db_session: AsyncSession,
        notification_template_in_db: NotificationTemplate,
    ):
        """Test successful template retrieval."""
        service = NotificationService()

        template = await service._get_template(
            "registration_confirmation", "email", db_session
        )

        assert template is not None
        assert template.template_type == "registration_confirmation"
        assert template.channel == "email"
        assert template.is_active is True

    @pytest.mark.unit
    async def test_get_template_not_found(self, db_session: AsyncSession):
        """Test template retrieval when template doesn't exist."""
        service = NotificationService()

        template = await service._get_template(
            "nonexistent_template", "email", db_session
        )

        assert template is None

    @pytest.mark.unit
    async def test_get_template_inactive(self, db_session: AsyncSession):
        """Test template retrieval ignores inactive templates."""
        # Create inactive template
        template = NotificationTemplate(
            template_type="test_template",
            channel="email",
            subject_en="Test",
            content_en="Test content",
            is_active=False,
        )
        db_session.add(template)
        await db_session.commit()

        service = NotificationService()

        result = await service._get_template("test_template", "email", db_session)

        assert result is None

    @pytest.mark.unit
    async def test_create_default_templates(self, db_session: AsyncSession):
        """Test creating default notification templates."""
        service = NotificationService()

        await service.create_default_templates(db_session)

        # Verify templates were created
        from sqlalchemy import select
        stmt = select(NotificationTemplate).where(
            NotificationTemplate.template_type == "registration_confirmation"
        )
        result = await db_session.execute(stmt)
        templates = result.scalars().all()

        assert len(templates) == 1
        template = templates[0]
        assert template.channel == "email"
        assert template.subject_en is not None
        assert template.subject_zh is not None
        assert template.content_en is not None
        assert template.content_zh is not None
        assert template.is_active is True

    @pytest.mark.unit
    async def test_create_default_templates_no_duplicates(
        self,
        db_session: AsyncSession,
        notification_template_in_db: NotificationTemplate,
    ):
        """Test that default templates are not duplicated."""
        service = NotificationService()

        # Template already exists, should not create duplicate
        await service.create_default_templates(db_session)

        # Count templates
        from sqlalchemy import select, func
        stmt = select(func.count(NotificationTemplate.id)).where(
            NotificationTemplate.template_type == "registration_confirmation"
        )
        result = await db_session.execute(stmt)
        count = result.scalar()

        assert count == 1  # Still only one template

    @pytest.mark.unit
    def test_schedule_reminder_placeholder(self, registration_in_db: Registration):
        """Test schedule reminder placeholder functionality."""
        service = NotificationService()

        # This is a placeholder method, should return True for now
        result = service.schedule_reminder(registration_in_db)

        assert result is True

    @pytest.mark.unit
    async def test_template_variable_substitution(
        self,
        db_session: AsyncSession,
        mock_settings,
    ):
        """Test that template variables are properly substituted."""
        # Create registration with class relationship
        from app.models.yoga_class import YogaClass
        from app.models.teacher import Teacher
        from app.models.yoga_type import YogaType

        yoga_type = YogaType(
            name_en="Hatha Yoga",
            name_zh="哈他瑜伽",
        )
        db_session.add(yoga_type)

        teacher = Teacher(
            name_en="Jane Smith",
            name_zh="简·史密斯",
        )
        db_session.add(teacher)

        yoga_class = YogaClass(
            name_en="Morning Hatha",
            name_zh="晨间哈他瑜伽",
            teacher=teacher,
            yoga_type=yoga_type,
            capacity=15,
        )
        db_session.add(yoga_class)

        registration = Registration(
            name="John Doe",
            email="john@example.com",
            class_id=yoga_class.id,
            target_date=date(2024, 3, 15),
            target_time=time(7, 0),
            preferred_language="en",
            email_confirmation_sent=False,
        )
        db_session.add(registration)

        template = NotificationTemplate(
            template_type="registration_confirmation",
            channel="email",
            subject_en="Confirmation for {class_name}",
            content_en="Dear {name}, your registration for {class_name} on {date} at {time} is confirmed.",
            variables=json.dumps(["name", "class_name", "date", "time"]),
            is_active=True,
        )
        db_session.add(template)
        await db_session.commit()

        service = NotificationService()

        with patch.object(service, '_send_smtp_email') as mock_smtp:
            mock_smtp.return_value = True

            await service.send_confirmation_email(registration_in_db, db_session)

            # Verify variable substitution
            call_args = mock_smtp.call_args[0]
            subject = call_args[1]
            content = call_args[2]

            assert "Morning Hatha" in subject
            assert "John Doe" in content
            assert "Morning Hatha" in content
            assert "2024-03-15" in content
            assert "07:00" in content

    @pytest.mark.unit
    async def test_send_confirmation_email_with_class_relationship(
        self,
        db_session: AsyncSession,
        registration_in_db: Registration,
        mock_settings,
    ):
        """Test email confirmation with complete class relationship data."""
        # Create template that uses class variables
        template = NotificationTemplate(
            template_type="registration_confirmation",
            channel="email",
            subject_en="Registration Confirmed",
            content_en="Dear {name}, your registration for {class_name} with {teacher_name} is confirmed.",
            variables=json.dumps(["name", "class_name", "teacher_name"]),
            is_active=True,
        )
        db_session.add(template)
        await db_session.commit()

        service = NotificationService()

        with patch.object(service, '_send_smtp_email') as mock_smtp:
            mock_smtp.return_value = True

            result = await service.send_confirmation_email(
                registration_in_db, db_session
            )

            assert result is True

            # Verify call was made with proper content
            call_args = mock_smtp.call_args[0]
            content = call_args[2]

            assert "John Doe" in content  # name
            # Note: The actual class and teacher names would depend on the fixture data