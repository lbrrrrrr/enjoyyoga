import uuid
import json
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.notification_template import NotificationTemplate
from app.models.registration import Registration
from app.models.contact_inquiry import ContactInquiry
from app.models.inquiry_reply import InquiryReply
from app.models.payment import Payment
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

    async def send_inquiry_confirmation_email(self, inquiry: ContactInquiry, db: AsyncSession) -> bool:
        """Send contact inquiry confirmation email to user."""
        try:
            # Get email template
            template = await self._get_template("inquiry_confirmation", "email", db)
            if not template:
                print(f"No email template found for inquiry confirmation")
                return False

            # Process template variables
            variables = {
                "name": inquiry.name,
                "email": inquiry.email,
                "subject": inquiry.subject,
                "category": inquiry.category,
                "inquiry_id": str(inquiry.id),
                "language": inquiry.preferred_language
            }

            # Select content based on language preference
            if inquiry.preferred_language == "zh":
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
                to_email=inquiry.email,
                subject=subject,
                content=content
            )

            if email_sent:
                print(f"✅ Inquiry confirmation email sent successfully to {inquiry.email}")
                return True
            else:
                print(f"❌ Failed to send inquiry confirmation email to {inquiry.email}")
                return False

        except Exception as e:
            print(f"Error sending inquiry confirmation email: {e}")
            return False

    async def send_admin_inquiry_notification(self, inquiry: ContactInquiry, db: AsyncSession) -> bool:
        """Send notification to admin about new contact inquiry."""
        try:
            # Get email template
            template = await self._get_template("admin_inquiry_notification", "email", db)
            if not template:
                print(f"No email template found for admin inquiry notification")
                return False

            # Process template variables
            variables = {
                "name": inquiry.name,
                "email": inquiry.email,
                "phone": inquiry.phone or "Not provided",
                "subject": inquiry.subject,
                "message": inquiry.message,
                "category": inquiry.category,
                "inquiry_id": str(inquiry.id),
                "preferred_language": inquiry.preferred_language
            }

            # Always send admin notifications in English
            subject = template.subject_en
            content = template.content_en

            # Replace template variables
            for key, value in variables.items():
                subject = subject.replace(f"{{{{{key}}}}}", str(value))
                content = content.replace(f"{{{{{key}}}}}", str(value))

            # Send email to admin (using settings.smtp_from_email as admin email for now)
            admin_email = settings.smtp_from_email
            email_sent = await self._send_smtp_email(
                to_email=admin_email,
                subject=subject,
                content=content
            )

            if email_sent:
                print(f"✅ Admin inquiry notification sent successfully to {admin_email}")
                return True
            else:
                print(f"❌ Failed to send admin inquiry notification to {admin_email}")
                return False

        except Exception as e:
            print(f"Error sending admin inquiry notification: {e}")
            return False

    async def send_inquiry_reply_email(self, reply: InquiryReply, inquiry: ContactInquiry, db: AsyncSession) -> bool:
        """Send inquiry reply email to user."""
        try:
            # Get email template
            template = await self._get_template("inquiry_reply", "email", db)
            if not template:
                print(f"No email template found for inquiry reply")
                return False

            # Process template variables
            variables = {
                "name": inquiry.name,
                "original_subject": inquiry.subject,
                "reply_message": reply.message,
                "inquiry_id": str(inquiry.id),
                "reply_id": str(reply.id)
            }

            # Select content based on original inquiry's language preference
            if inquiry.preferred_language == "zh":
                subject = template.subject_zh
                content = template.content_zh
            else:
                subject = template.subject_en
                content = template.content_en

            # Use reply subject if available, otherwise use template subject
            if reply.subject:
                subject = reply.subject

            # Replace template variables
            for key, value in variables.items():
                subject = subject.replace(f"{{{{{key}}}}}", str(value))
                content = content.replace(f"{{{{{key}}}}}", str(value))

            # Send actual email
            email_sent = await self._send_smtp_email(
                to_email=inquiry.email,
                subject=subject,
                content=content
            )

            if email_sent:
                print(f"✅ Inquiry reply email sent successfully to {inquiry.email}")
                return True
            else:
                print(f"❌ Failed to send inquiry reply email to {inquiry.email}")
                return False

        except Exception as e:
            print(f"Error sending inquiry reply email: {e}")
            return False

    async def send_payment_pending_email(self, registration: Registration, payment: Payment, db: AsyncSession) -> bool:
        """Send payment pending email to user with amount and reference number."""
        try:
            template = await self._get_template("payment_pending", "email", db)
            if not template:
                print(f"No email template found for payment pending")
                return False

            variables = {
                "name": registration.name,
                "email": registration.email,
                "registration_id": str(registration.id),
                "amount": f"{float(payment.amount):.2f}",
                "currency": payment.currency,
                "reference_number": payment.reference_number,
                "language": registration.preferred_language
            }

            if registration.preferred_language == "zh":
                subject = template.subject_zh
                content = template.content_zh
            else:
                subject = template.subject_en
                content = template.content_en

            for key, value in variables.items():
                subject = subject.replace(f"{{{{{key}}}}}", str(value))
                content = content.replace(f"{{{{{key}}}}}", str(value))

            email_sent = await self._send_smtp_email(
                to_email=registration.email,
                subject=subject,
                content=content
            )

            if email_sent:
                print(f"✅ Payment pending email sent successfully to {registration.email}")
                return True
            else:
                print(f"❌ Failed to send payment pending email to {registration.email}")
                return False

        except Exception as e:
            print(f"Error sending payment pending email: {e}")
            return False

    async def send_payment_confirmed_email(self, registration: Registration, payment: Payment, db: AsyncSession) -> bool:
        """Send payment confirmed email to user."""
        try:
            template = await self._get_template("payment_confirmed", "email", db)
            if not template:
                print(f"No email template found for payment confirmed")
                return False

            variables = {
                "name": registration.name,
                "email": registration.email,
                "registration_id": str(registration.id),
                "amount": f"{float(payment.amount):.2f}",
                "currency": payment.currency,
                "reference_number": payment.reference_number,
                "language": registration.preferred_language
            }

            if registration.preferred_language == "zh":
                subject = template.subject_zh
                content = template.content_zh
            else:
                subject = template.subject_en
                content = template.content_en

            for key, value in variables.items():
                subject = subject.replace(f"{{{{{key}}}}}", str(value))
                content = content.replace(f"{{{{{key}}}}}", str(value))

            email_sent = await self._send_smtp_email(
                to_email=registration.email,
                subject=subject,
                content=content
            )

            if email_sent:
                registration.email_confirmation_sent = True
                await db.commit()
                print(f"✅ Payment confirmed email sent successfully to {registration.email}")
                return True
            else:
                print(f"❌ Failed to send payment confirmed email to {registration.email}")
                return False

        except Exception as e:
            print(f"Error sending payment confirmed email: {e}")
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
            },
            {
                "template_type": "inquiry_confirmation",
                "channel": "email",
                "subject_en": "Thank you for contacting enjoyyoga",
                "subject_zh": "感谢您联系enjoyyoga",
                "content_en": """Dear {{name}},

Thank you for reaching out to enjoyyoga! We have received your inquiry.

Inquiry Details:
- Subject: {{subject}}
- Category: {{category}}
- Inquiry ID: {{inquiry_id}}

Our team will review your message and get back to you within 24-48 hours.

If you have any urgent questions, please don't hesitate to contact us directly.

Best regards,
The enjoyyoga Team""",
                "content_zh": """亲爱的 {{name}}，

感谢您联系enjoyyoga！我们已收到您的咨询。

咨询详情：
- 主题：{{subject}}
- 类别：{{category}}
- 咨询ID：{{inquiry_id}}

我们的团队会审阅您的消息，并在24-48小时内回复您。

如果您有任何紧急问题，请随时直接联系我们。

最好的问候，
enjoyyoga团队""",
                "variables": json.dumps(["name", "email", "subject", "category", "inquiry_id", "language"]),
                "is_active": True
            },
            {
                "template_type": "admin_inquiry_notification",
                "channel": "email",
                "subject_en": "New Contact Inquiry - enjoyyoga",
                "subject_zh": "新的联系咨询 - enjoyyoga",
                "content_en": """New contact inquiry received:

From: {{name}} ({{email}})
Phone: {{phone}}
Category: {{category}}
Preferred Language: {{preferred_language}}

Subject: {{subject}}

Message:
{{message}}

Inquiry ID: {{inquiry_id}}

Please review and respond to this inquiry through the admin dashboard.

Best regards,
enjoyyoga System""",
                "content_zh": """收到新的联系咨询：

来自：{{name}} ({{email}})
电话：{{phone}}
类别：{{category}}
首选语言：{{preferred_language}}

主题：{{subject}}

消息：
{{message}}

咨询ID：{{inquiry_id}}

请通过管理面板审阅并回复此咨询。

最好的问候，
enjoyyoga系统""",
                "variables": json.dumps(["name", "email", "phone", "subject", "message", "category", "inquiry_id", "preferred_language"]),
                "is_active": True
            },
            {
                "template_type": "inquiry_reply",
                "channel": "email",
                "subject_en": "Re: {{original_subject}} - enjoyyoga",
                "subject_zh": "回复：{{original_subject}} - enjoyyoga",
                "content_en": """Dear {{name}},

Thank you for contacting enjoyyoga. We have reviewed your inquiry and here is our response:

{{reply_message}}

---

Your Original Inquiry (Reference: {{inquiry_id}}):
Subject: {{original_subject}}

If you have any further questions, please don't hesitate to reach out to us.

Best regards,
The enjoyyoga Team""",
                "content_zh": """亲爱的 {{name}}，

感谢您联系enjoyyoga。我们已审阅您的咨询，以下是我们的回复：

{{reply_message}}

---

您的原始咨询（参考编号：{{inquiry_id}}）：
主题：{{original_subject}}

如果您有任何其他问题，请随时联系我们。

最好的问候，
enjoyyoga团队""",
                "variables": json.dumps(["name", "original_subject", "reply_message", "inquiry_id", "reply_id"]),
                "is_active": True
            },
            {
                "template_type": "payment_pending",
                "channel": "email",
                "subject_en": "Payment Required - enjoyyoga Registration",
                "subject_zh": "待付款 - enjoyyoga课程报名",
                "content_en": """Dear {{name}},

Thank you for registering for a yoga class at enjoyyoga!

Your registration requires payment to be confirmed. Please complete the payment using the details below:

Payment Details:
- Amount: {{currency}} {{amount}}
- Reference Number: {{reference_number}}
- Registration ID: {{registration_id}}

How to Pay:
1. Open WeChat and scan the QR code on our payment page
2. Enter the amount: {{currency}} {{amount}}
3. IMPORTANT: Include the reference number {{reference_number}} in the payment note/message

Your registration will be confirmed once we verify your payment.

If you have any questions, please contact us.

Best regards,
The enjoyyoga Team""",
                "content_zh": """亲爱的 {{name}}，

感谢您在enjoyyoga报名瑜伽课程！

您的报名需要完成付款后才能确认。请使用以下信息完成支付：

付款详情：
- 金额：{{currency}} {{amount}}
- 参考编号：{{reference_number}}
- 报名ID：{{registration_id}}

支付方式：
1. 打开微信扫描我们支付页面上的二维码
2. 输入金额：{{currency}} {{amount}}
3. 重要提示：请在付款备注中填写参考编号 {{reference_number}}

我们确认收到您的付款后，您的报名将被确认。

如有任何问题，请联系我们。

最好的问候，
enjoyyoga团队""",
                "variables": json.dumps(["name", "email", "registration_id", "amount", "currency", "reference_number", "language"]),
                "is_active": True
            },
            {
                "template_type": "payment_confirmed",
                "channel": "email",
                "subject_en": "Payment Confirmed - enjoyyoga",
                "subject_zh": "付款已确认 - enjoyyoga",
                "content_en": """Dear {{name}},

Great news! Your payment has been confirmed and your registration is now complete.

Payment Details:
- Amount: {{currency}} {{amount}}
- Reference Number: {{reference_number}}
- Registration ID: {{registration_id}}
- Status: Confirmed

We look forward to seeing you at the class!

Best regards,
The enjoyyoga Team""",
                "content_zh": """亲爱的 {{name}}，

好消息！您的付款已确认，报名已完成。

付款详情：
- 金额：{{currency}} {{amount}}
- 参考编号：{{reference_number}}
- 报名ID：{{registration_id}}
- 状态：已确认

我们期待在课堂上见到您！

最好的问候，
enjoyyoga团队""",
                "variables": json.dumps(["name", "email", "registration_id", "amount", "currency", "reference_number", "language"]),
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