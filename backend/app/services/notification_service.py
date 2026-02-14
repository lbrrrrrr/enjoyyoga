import uuid
import json
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.notification_template import NotificationTemplate
from app.models.registration import Registration
from app.config import settings


class NotificationService:
    def __init__(self):
        pass

    async def send_confirmation_email(self, registration: Registration, db: AsyncSession) -> bool:
        """Send registration confirmation email."""
        try:
            # Get email template
            template = await self._get_template("registration_confirmation", "email", db)
            if not template:
                print(f"No email template found for registration confirmation")
                return False

            # Process template variables
            variables = {
                "name": registration.name,
                "email": registration.email,
                "registration_id": str(registration.id),
                "status": registration.status,
                "language": registration.preferred_language
            }

            # Select content based on language preference
            if registration.preferred_language == "zh":
                subject = template.subject_zh
                content = template.content_zh
            else:
                subject = template.subject_en
                content = template.content_en

            # Replace template variables
            for key, value in variables.items():
                subject = subject.replace(f"{{{{{key}}}}}", str(value))
                content = content.replace(f"{{{{{key}}}}}", str(value))

            # Send actual email
            email_sent = await self._send_smtp_email(
                to_email=registration.email,
                subject=subject,
                content=content
            )

            if email_sent:
                # Mark as sent
                registration.email_confirmation_sent = True
                await db.commit()
                print(f"✅ Email sent successfully to {registration.email}")
                return True
            else:
                print(f"❌ Failed to send email to {registration.email}")
                return False

        except Exception as e:
            print(f"Error sending confirmation email: {e}")
            return False

    async def _send_smtp_email(self, to_email: str, subject: str, content: str) -> bool:
        """Send email via SMTP."""
        try:
            # Skip sending if SMTP is not configured
            if not settings.smtp_username or not settings.smtp_password:
                print(f"📧 SMTP not configured. Email would be sent to: {to_email}")
                print(f"Subject: {subject}")
                print(f"Content: {content}")
                return True  # Return true for development

            # Create message
            message = MIMEMultipart()
            message["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
            message["To"] = to_email
            message["Subject"] = subject

            # Add body to email
            message.attach(MIMEText(content, "plain"))

            # Send email
            await aiosmtplib.send(
                message,
                hostname=settings.smtp_host,
                port=settings.smtp_port,
                start_tls=settings.smtp_use_tls,
                username=settings.smtp_username,
                password=settings.smtp_password,
            )

            return True

        except Exception as e:
            print(f"Error sending email via SMTP: {e}")
            return False

        except Exception as e:
            print(f"Error sending confirmation email: {e}")
            return False

    async def schedule_reminder(self, registration: Registration) -> bool:
        """Schedule a reminder for the registration (placeholder for background task)."""
        try:
            # TODO: Implement Celery task scheduling
            print(f"SCHEDULING REMINDER for registration {registration.id}")
            return True
        except Exception as e:
            print(f"Error scheduling reminder: {e}")
            return False

    async def _get_template(self, template_type: str, channel: str, db: AsyncSession) -> NotificationTemplate:
        """Get notification template by type and channel."""
        query = select(NotificationTemplate).where(
            NotificationTemplate.template_type == template_type,
            NotificationTemplate.channel == channel,
            NotificationTemplate.is_active == True
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def create_default_templates(self, db: AsyncSession):
        """Create default notification templates if they don't exist."""
        templates = [
            {
                "template_type": "registration_confirmation",
                "channel": "email",
                "subject_en": "Registration Confirmed - enjoyyoga",
                "subject_zh": "报名确认 - enjoyyoga",
                "content_en": """Dear {{name}},

Your registration for yoga class has been confirmed!

Registration Details:
- Registration ID: {{registration_id}}
- Status: {{status}}
- Email: {{email}}

We look forward to seeing you at the class.

Best regards,
The enjoyyoga Team""",
                "content_zh": """亲爱的 {{name}}，

您的瑜伽课程报名已确认！

报名详情：
- 报名ID：{{registration_id}}
- 状态：{{status}}
- 邮箱：{{email}}

我们期待在课堂上见到您。

最好的问候，
enjoyyoga团队""",
                "variables": json.dumps(["name", "email", "registration_id", "status", "language"]),
                "is_active": True
            }
        ]

        for template_data in templates:
            # Check if template already exists
            existing = await self._get_template(
                template_data["template_type"],
                template_data["channel"],
                db
            )
            if not existing:
                template = NotificationTemplate(**template_data)
                db.add(template)

        await db.commit()

    async def _send_smtp_email(self, to_email: str, subject: str, content: str) -> bool:
        """Send email via SMTP."""
        try:
            # Skip sending if SMTP is not configured
            if not settings.smtp_username or not settings.smtp_password:
                print(f"📧 SMTP not configured. Email would be sent to: {to_email}")
                print(f"Subject: {subject}")
                print(f"Content: {content}")
                return True  # Return true for development

            # Create message
            message = MIMEMultipart()
            message["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
            message["To"] = to_email
            message["Subject"] = subject

            # Add body to email
            message.attach(MIMEText(content, "plain"))

            # Send email
            await aiosmtplib.send(
                message,
                hostname=settings.smtp_host,
                port=settings.smtp_port,
                start_tls=settings.smtp_use_tls,
                username=settings.smtp_username,
                password=settings.smtp_password,
            )

            return True

        except Exception as e:
            print(f"Error sending email via SMTP: {e}")
            return False