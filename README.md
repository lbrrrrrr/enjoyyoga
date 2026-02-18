# enjoyyoga

A bilingual (English/Chinese) web application for a yoga business, featuring class listings, teacher profiles, yoga type descriptions, a class registration system, contact inquiry management system with admin reply functionality, and registration tracking via magic link.

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

### Frontend Unit Tests

The frontend includes a comprehensive unit testing suite covering all critical functionality with modern testing tools:

#### Running Tests

```bash
cd frontend

# Run all unit tests
npm run test

# Run in watch mode (recommended for development)
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run with interactive UI
npm run test:ui

# Run specific test files
npm test -- InquiriesClient
npm test -- api.test.ts

# Run tests matching pattern
npm test -- -t "should render"

# Single run (no watch mode)
npm test -- --run
```

#### Test Coverage (80 total tests - 100% pass rate)

- ✅ **Public API Client** (26 tests) - Complete coverage of all public endpoints
- ✅ **Admin API Client** (26 tests) - JWT authentication, CRUD operations, file uploads
- ✅ **InquiriesClient Component** (28 tests) - Complex admin component with modal interactions

#### Key Features

- **Modern Testing Stack**: Vitest (10-20x faster than Jest) + React Testing Library + MSW
- **Bilingual Testing**: Complete English/Chinese internationalization support
- **Network-Level Mocking**: MSW (Mock Service Worker) for realistic API testing
- **Component Integration**: Full user interaction testing with form submissions and modal workflows
- **Fast Execution**: Complete test suite runs in ~1.5 seconds

#### Test Structure

```
frontend/src/
├── __tests__/                    # Main test directory
│   ├── components/
│   │   └── admin/
│   │       └── InquiriesClient.test.tsx  # Complex component tests
│   └── lib/
│       ├── api.test.ts           # Public API client tests
│       └── admin-api.test.ts     # Admin API client tests
└── test/                         # Test utilities and configuration
    ├── setup.ts                  # Test environment setup
    ├── utils.tsx                 # Custom render utilities with i18n
    └── mocks/
        └── handlers.ts           # MSW API request handlers
```

#### Frontend Logic Covered

- **API Integration**: All endpoints tested with success/error scenarios and authentication
- **Component Interactions**: Modal opening/closing, form submissions, user input validation
- **State Management**: Loading states, error handling, data synchronization
- **Bilingual Support**: Translation rendering, language switching, message formatting
- **User Workflows**: Complete inquiry management workflow from viewing to replying
- **Authentication**: JWT token handling, session management, protected routes
- **Form Validation**: Input validation, error display, submission prevention

#### Testing Approach

The frontend tests focus on **user behavior** rather than implementation details:

```javascript
// Example: Testing user interactions, not internal state
test('should filter inquiries by status', async () => {
  const user = userEvent.setup()
  renderWithIntl(<InquiriesClient />)

  const statusSelect = screen.getByLabelText('Status')
  await user.selectOptions(statusSelect, 'open')

  expect(api.getContactInquiries).toHaveBeenCalledWith('open', undefined)
})
```

**Key Testing Patterns:**
- **Bilingual Rendering**: Tests for both English and Chinese content
- **API Integration**: MSW provides network-level request interception
- **User-Centric**: Tests simulate real user interactions (click, type, select)
- **Async Operations**: Proper waiting for state updates and API responses

#### Technology Stack

- **Test Runner**: Vitest with native ESM and TypeScript support
- **Component Testing**: React Testing Library for user-centric testing
- **API Mocking**: Mock Service Worker (MSW) for network request interception
- **Internationalization**: Custom utilities for testing next-intl translations
- **Environment**: jsdom with React 19 and Next.js 15 compatibility

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

## Registration Tracking (Magic Link)

The application includes a registration tracking system that allows users to check the status of all their registrations and payments without needing an account.

### How It Works

- When a user registers for a class, a **unique tracking token** (64-character cryptographic hex string) is generated for their email address
- A **tracking link** is included in every registration confirmation and payment email
- Users click the link to view all their registrations, class details, dates, status, and payment information
- One token per email — created on first registration, reused for all subsequent ones

### Features

- **Tracking Page** (`/[locale]/track/{token}`): Shows all registrations for the email with class name, date, status badges, and payment details
- **Recovery Page** (`/[locale]/track`): Users who lose their link can enter their email to receive it again
- **Anti-Enumeration**: Recovery endpoint always returns success regardless of whether the email exists
- **Bilingual**: Full English/Chinese support for the tracking and recovery pages

### User Flow

1. User registers for a class → receives email with tracking link
2. User clicks tracking link → sees all registrations and payment status
3. If link is lost → user visits `/[locale]/track`, enters email, receives new email with the link

### API Endpoints

- `GET /api/track/{token}` — Returns all registrations for the token's email
- `POST /api/track/request-link` — Sends tracking link email to the given address

### Configuration

Set `FRONTEND_URL` in `.env` for production (default: `http://localhost:3000`). This is used to build tracking URLs in emails.

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
