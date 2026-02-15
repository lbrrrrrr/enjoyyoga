# enjoyyoga

A bilingual (English/Chinese) web application for a yoga business, featuring class listings, teacher profiles, yoga type descriptions, a class registration system, and a contact inquiry management system with admin reply functionality.

## Tech Stack

- **Frontend**: Next.js 15 (TypeScript), shadcn/ui, Tailwind CSS, next-intl
- **Backend**: FastAPI, SQLAlchemy (async), asyncpg
- **Database**: PostgreSQL

## Local Development Setup

> **Note**: The following instructions are for **local development only**. Production deployment will require different configurations, environment management, process managers, and infrastructure setup.

### Backend

1. **Setup** (run once):
```bash
cd backend
uv sync
cp .env.example .env  # Edit with your database credentials
uv run alembic upgrade head

# Setup initial data and email templates
uv run python setup_admin.py          # Create admin user
uv run python seed.py                 # Seed sample data (optional)
uv run python setup_contact_templates.py  # Setup contact inquiry email templates
```

2. **Start the development server** (run in a dedicated terminal):
```bash
cd backend
uv run uvicorn app.main:app --reload
```

The server will start in the foreground and you should see output like:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using WatchFiles
```

- **API docs available at**: http://localhost:8000/docs
- **To stop the server**: Press `Ctrl+C` in the terminal
- **If you get "Address already in use"**: Check for background processes with `lsof -i :8000` and kill them if needed

### Frontend

1. **Setup** (run once):
```bash
cd frontend
npm install
```

2. **Start the development server** (run in a separate terminal):
```bash
cd frontend
npm run dev
```

The development server will start and you should see output like:
```
▲ Next.js 15.x.x
- Local:        http://localhost:3000
```

- **Visit**: http://localhost:3000
- **To stop the server**: Press `Ctrl+C` in the terminal

## Development Workflow

For full-stack development, you'll need **two terminal windows**:

1. **Terminal 1** - Backend server:
   ```bash
   cd backend && uv run uvicorn app.main:app --reload
   ```

2. **Terminal 2** - Frontend development server:
   ```bash
   cd frontend && npm run dev
   ```

Both servers support hot reloading, so changes will be reflected automatically.

## Testing

### Backend Unit Tests

The backend includes a comprehensive unit testing suite covering all business logic:

#### Running Tests

```bash
cd backend

# Run all unit tests
uv run pytest

# Run with verbose output
uv run pytest -v

# Run specific test categories
uv run pytest -m unit                    # Unit tests only
uv run pytest tests/unit/services/       # Service layer tests
uv run pytest tests/unit/test_auth.py    # Authentication tests

# Run with coverage report
uv run pytest --cov=app --cov-report=html
uv run pytest --cov=app --cov-report=term-missing
```

#### Test Coverage (128 total tests)

- ✅ **ScheduleParserService** (30 tests) - Schedule parsing and validation logic
- ✅ **RegistrationService** (17 tests) - Registration management with capacity validation
- ✅ **NotificationService** (16 tests) - Email notifications and template management
- ✅ **Authentication** (26 tests) - JWT tokens, password hashing, admin auth
- ✅ **Admin Router** (21 tests) - Protected routes, dashboard statistics
- ✅ **Registrations Router** (18 tests) - Registration endpoints, validation

#### Key Features

- **Fast Execution**: In-memory SQLite database for speed
- **Comprehensive Coverage**: All critical business logic tested
- **Async Support**: Full async/await testing with pytest-asyncio
- **Mocked Dependencies**: External services (SMTP, etc.) properly mocked
- **Edge Cases**: Comprehensive error handling and boundary condition testing

#### Test Structure

```
backend/tests/
├── conftest.py                          # Test configuration & fixtures
├── unit/
│   ├── test_auth.py                     # Authentication & security tests
│   ├── services/
│   │   ├── test_schedule_parser.py      # Schedule parsing logic
│   │   ├── test_registration_service.py # Registration business logic
│   │   └── test_notification_service.py # Email notification logic
│   └── routers/
│       ├── test_admin.py                # Admin API endpoints
│       └── test_registrations.py        # Registration API endpoints
└── README.md                            # Detailed testing documentation
```

#### Business Logic Covered

- Schedule string parsing with regex validation
- Registration capacity management and waitlist logic
- Email template variable substitution and bilingual support
- JWT authentication and password security
- Admin dashboard statistics and user management
- Input validation, error handling, and edge cases

See `backend/tests/README.md` for detailed testing documentation.

## Email Configuration (SMTP)

The application supports email notifications for class registrations and contact inquiries. To configure email sending:

### Development Mode (Current)
Without SMTP configuration, emails are printed to the backend console for testing purposes.

### Production SMTP Setup

**TODO: Configure SMTP for actual email sending**

Add the following environment variables to your `.env` file:

```bash
# SMTP Email Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=enjoyyoga
SMTP_USE_TLS=true
```

#### Gmail Configuration
1. Enable 2-factor authentication on your Gmail account
2. Go to Google Account Settings → Security → App passwords
3. Generate an app password for "Mail"
4. Use the 16-character app password (not your regular Gmail password)

#### Other SMTP Providers
- **Outlook**: `smtp.live.com:587`
- **Yahoo**: `smtp.mail.yahoo.com:587`
- **SendGrid**: Configure with SendGrid SMTP settings
- **Mailgun**: Configure with Mailgun SMTP settings
- **AWS SES**: Configure with SES SMTP settings

#### Testing Email Configuration
- **Development**: Check backend console for `📧 SMTP not configured` messages
- **With SMTP**: Look for `✅ Email sent successfully` or `❌ Failed to send email` messages
- **Testing Methods**:
  - Register for a class to trigger a confirmation email
  - Submit a contact inquiry to trigger user confirmation and admin notification emails
  - Reply to an inquiry from the admin panel to trigger reply emails

## Contact Inquiry System

The application includes a comprehensive contact inquiry management system that allows users to submit inquiries and administrators to manage and respond to them.

### Features

#### For Users
- **Floating Contact Widget**: Always available contact button in the bottom-right corner of the website
- **Bilingual Contact Form**: Supports both English and Chinese with automatic language detection
- **Categorized Inquiries**: Users can categorize inquiries as "Scheduling", "General", or "Business"
- **Email Confirmations**: Automatic confirmation emails sent to users upon form submission

#### For Administrators
- **Admin Dashboard**: Dedicated `/admin/inquiries` page for managing all contact inquiries
- **Statistics Overview**: Real-time counts showing total inquiries and breakdown by status
- **Status Management**: Track inquiries through workflow: Open → In Progress → Resolved → Closed
- **Reply System**: Send replies to users directly from the admin panel with email delivery
- **Filtering & Search**: Filter inquiries by status, category, and pagination support
- **Admin Notes**: Add internal notes to inquiries for team coordination

### User Experience Flow

1. **Contact Submission**:
   - User clicks the floating "Contact Us" button
   - Modal opens with bilingual contact form
   - User selects category, fills in details, and submits
   - User receives immediate confirmation email
   - Admin receives notification email about new inquiry

2. **Admin Management**:
   - Admin navigates to `/admin/inquiries`
   - Views statistics dashboard and inquiry list
   - Clicks on inquiry to view full details and conversation history
   - Updates status and adds admin notes as needed
   - Composes and sends replies directly to users
   - Tracks email delivery status for all communications

### Database Structure

The system uses two main database tables:

- **`contact_inquiries`**: Stores user inquiries with fields for categorization, status tracking, and language preferences
- **`inquiry_replies`**: Stores admin responses with email delivery tracking and conversation threading

### Email Templates

Four email templates handle all contact inquiry communications:

1. **User Confirmation** (`inquiry_confirmation`): Bilingual confirmation sent to users
2. **Admin Notification** (`admin_inquiry_notification`): Alert sent to admins for new inquiries
3. **Inquiry Reply** (`inquiry_reply`): Responses from admins to users with conversation threading
4. **Registration Confirmation**: Existing template reused for class registrations

### API Endpoints

- **Public API** (`/api/contact/inquiries`): For user form submissions
- **Admin API** (`/api/admin/contact/*`): Protected endpoints for inquiry management, statistics, and replies

### Access Control

- Contact form is publicly accessible to all website visitors
- Admin management requires JWT authentication
- All admin actions are logged and tracked for accountability

## Production Deployment

The above setup is **for development only**. For production, you'll need to consider:

### Backend
- Use a production ASGI server (e.g., Gunicorn with Uvicorn workers)
- Set up proper environment variables and secrets management
- Configure a process manager (systemd, Docker, etc.)
- Set up proper logging and monitoring
- Use a production database with connection pooling
- Implement proper security headers and CORS policies

### Frontend
- Build the Next.js app for production (`npm run build`)
- Serve static assets through a CDN
- Configure proper environment variables for production APIs
- Set up SSL/TLS certificates

### Infrastructure
- Set up reverse proxy (nginx, Apache, or cloud load balancer)
- Configure database backups and replication
- Set up monitoring and alerting
- Implement CI/CD pipelines
- Container orchestration (Docker/Kubernetes) if applicable
