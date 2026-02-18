# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

enjoyyoga is a bilingual (English/Chinese) yoga business management application with class listings, teacher profiles, yoga type descriptions, class registration system, health & liability consent form, WeChat Pay integration (static QR code), contact inquiry management with email notifications and admin reply functionality, registration tracking via magic link, and a policies page covering studio rules, payments, and cancellations.

## Development Commands

### Backend (FastAPI + PostgreSQL)

```bash
# Setup (run once)
cd backend
uv sync
cp .env.example .env  # Edit with database credentials
uv run alembic upgrade head
uv run python setup_admin.py              # Create admin user + default email templates
uv run python setup_contact_templates.py  # Contact inquiry email templates
uv run python setup_payment_templates.py  # Payment email templates

# Start development server (with email enabled)
cd backend
export SMTP_PASSWORD=$(security find-generic-password -a "enjoyyoga" -s "smtp-password" -w)
uv run uvicorn app.main:app --reload

# Start development server (without email — prints to console)
cd backend
uv run uvicorn app.main:app --reload

# Database migrations
uv run alembic revision --autogenerate -m "description"
uv run alembic upgrade head
uv run alembic downgrade -1

# Create admin user
uv run python setup_admin.py

# Seed database with sample data
uv run python seed.py

# Setup contact inquiry email templates
uv run python setup_contact_templates.py

# Setup payment email templates
uv run python setup_payment_templates.py

# Run unit tests
uv run pytest                    # All tests
uv run pytest -v               # Verbose output
uv run pytest -m unit          # Unit tests only
uv run pytest --cov=app        # With coverage report
uv run pytest tests/unit/services/  # Service layer tests
uv run pytest tests/unit/test_auth.py  # Authentication tests
```

### Frontend (Next.js 15 + TypeScript)

```bash
# Setup (run once)
cd frontend
npm install

# Start development server
cd frontend
npm run dev

# Build for production
npm run build
npm run start

# Lint
npm run lint

# Run unit tests
npm run test                    # All tests
npm run test:watch             # Watch mode (re-runs on file changes)
npm run test:coverage          # With coverage report
npm run test:ui                # Interactive UI mode
npm test -- --run             # Run once without watch mode
npm test -- InquiriesClient   # Run specific test file
npm test -- -t "should render"  # Run tests matching pattern
```

### Full Development Workflow

Requires two terminals running simultaneously:
1. Backend: `cd backend && uv run uvicorn app.main:app --reload`
2. Frontend: `cd frontend && npm run dev`

### Git Hooks

**Auto PR Creation** (`.git/hooks/post-push`):
- Automatically creates a pull request when you push to any non-main branch
- Shows the PR URL immediately in your terminal after push
- Checks if PR already exists before creating (no duplicates)
- Requires GitHub CLI (`gh`) installed and authenticated
- Skips gracefully if `gh` is not available

**Example workflow**:
```bash
git checkout -b feature/new-feature
# make changes...
git add .
git commit -m "Add new feature"
git push -u origin feature/new-feature
# PR is created automatically and URL is displayed in terminal
```

## GitHub Actions

The repository uses GitHub Actions for continuous integration with automated testing and code review on every push and pull request.

### Continuous Integration Workflows

**Backend Tests** (`backend-tests.yml`):
- Runs automatically on every push to `main` and on all pull requests
- Executes 155+ unit tests covering all business logic and API endpoints
- Generates coverage reports (HTML + JSON) with branch coverage
- Fast execution with dependency caching (~30-60 seconds)
- Uploads test results and coverage reports as downloadable artifacts (90-day retention)
- Tests: schedule parsing, registration management, email notifications, JWT auth, admin APIs, payment integration

**Frontend Tests** (`frontend-tests.yml`):
- Runs automatically on every push to `main` and on all pull requests
- Executes 80+ unit tests covering UI components and API integration
- Modern test stack: Vitest + React Testing Library + MSW (Mock Service Worker)
- Fast execution with npm caching (~20-40 seconds)
- Uploads test results and coverage reports as downloadable artifacts (90-day retention)
- Tests: API clients (public + admin), React components, bilingual i18n, error handling

**Claude PR Review** (`claude-pr-review.yml`):
- Automated code review using Claude AI for all pull requests
- Triggers on PR open, update, and reopen
- Reviews for security, bugs, code quality, and best practices
- Posts detailed feedback as PR comments
- Handles large PRs gracefully (>100KB diffs skipped)
- Uses Claude Sonnet 4.5 for comprehensive analysis

### Setup Instructions

**For Backend/Frontend Tests** (automatic - no setup needed):
- Tests run automatically on every push and PR
- View results in GitHub Actions tab
- Download test artifacts for detailed coverage reports

**For Claude PR Review**:
1. Get Claude API key from [console.anthropic.com](https://console.anthropic.com)
2. Add `ANTHROPIC_API_KEY` secret in GitHub repository settings (Settings → Secrets and variables → Actions)
3. Open a PR to trigger automatic review

### CI Performance

- **Total CI time**: ~1-2 minutes with caching
- **Parallel execution**: Backend and frontend tests run simultaneously
- **Artifact retention**: 90 days for test results and coverage reports
- **Status checks**: Configure branch protection to require all workflows to pass before merge

See `.github/workflows/README.md` for detailed documentation, troubleshooting, and customization options.

## Architecture

### Backend Structure

**Framework**: FastAPI with async SQLAlchemy ORM, PostgreSQL database

**Key Directories**:
- `app/models/` - SQLAlchemy models (yoga_class.py, teacher.py, registration.py, payment.py, class_package.py, payment_settings.py, contact_inquiry.py, inquiry_reply.py, consent_record.py, tracking_token.py, etc.)
- `app/routers/` - FastAPI route handlers (classes.py, teachers.py, admin.py, payments.py, contact.py, consent.py, tracking.py, etc.)
- `app/schemas/` - Pydantic models for request/response validation (payment.py, contact.py, consent.py, tracking.py, etc.)
- `app/services/` - Business logic (registration_service.py, payment_service.py, notification_service.py, schedule_parser.py, contact_service.py, consent_service.py, tracking_service.py)
- `alembic/` - Database migration files

**Authentication**: JWT-based admin authentication in `app/auth.py`

**Configuration**: Environment-based settings in `app/config.py` (database URL, CORS, JWT, SMTP, frontend URL)

**Entry Point**: `app/main.py` - FastAPI application setup with CORS and router inclusion

### Frontend Structure

**Framework**: Next.js 15 App Router with TypeScript, Tailwind CSS, shadcn/ui components

**Internationalization**: next-intl with English/Chinese locales using `[locale]` dynamic routing

**Key Directories**:
- `src/app/[locale]/` - Internationalized pages (admin/, classes/, teachers/, payment/, consent/, policies/, track/, admin/inquiries/, admin/payments/, admin/payment-settings/, admin/consents/, etc.)
- `src/components/` - Reusable UI components (built with shadcn/ui, includes contact/ and admin/ subdirectories for PaymentsClient, PaymentSettingsClient, ConsentsClient, etc.)
- `src/lib/` - Utility functions and API clients
- `src/messages/` - Translation files for English/Chinese
- `src/i18n/` - Internationalization configuration

**Admin Panel**: Located at `/[locale]/admin/` with protected routes for dashboard, teachers, registrations, payments, payment settings, contact inquiries, consent records, and notifications

### Database Schema

**Core Models**:
- `YogaClass` - Class definitions with bilingual names/descriptions, scheduling data, pricing, teacher/type relationships
- `ClassSession` - Specific instances of classes with date/time
- `ClassPackage` - Multi-session discount packages for classes (session count, discounted price)
- `Teacher` - Teacher profiles with bilingual bios and credentials
- `YogaType` - Yoga style categories (Hatha, Vinyasa, etc.)
- `Registration` - Student class registrations with contact info and payment status
- `Payment` - Payment records with reference numbers, amounts, status tracking, and admin confirmation
- `PaymentSettings` - Singleton configuration for WeChat QR code URL and bilingual payment instructions
- `ContactInquiry` - Contact form submissions with categorization, status tracking, and admin notes
- `InquiryReply` - Admin replies to contact inquiries with email delivery tracking
- `ConsentRecord` - Signed health & liability waivers per email + yoga type combination
- `TrackingToken` - Persistent per-email tokens for registration tracking via magic link
- `AdminUser` - Admin authentication
- `NotificationTemplate` - Email template management

**Relationships**: Classes belong to teachers and yoga types; classes have many packages; registrations link students to specific class sessions and have an optional payment; payments reference packages and are confirmed by admin users; contact inquiries have many replies from admin users; consent records link an email address to a yoga type with a unique constraint preventing duplicates; tracking tokens map one-to-one with email addresses for persistent registration tracking

## Key Features

### Class Management
- Bilingual class definitions with scheduling
- Recurring and one-time class support
- Capacity management and registration tracking
- Schedule parsing for complex recurring patterns
- Per-session pricing with optional multi-session discount packages

### Registration System
- Student registration with contact information
- Optional schedule selection for recurring classes
- Email confirmation notifications
- Admin dashboard for registration management
- Payment-aware registration: free classes confirm immediately, paid classes enter `pending_payment` status
- Consent-gated registration: displays waiver warning and blocks submission if consent is missing for the class's yoga type

### Consent Form System
- Health & liability waiver required before registering for any class
- Consent is scoped to yoga type — users sign once per yoga type, not per class
- Inline modal during registration with name/email pre-filled from the registration form
- Standalone consent page at `/[locale]/consent` with yoga type selection and return URL support
- Idempotent: re-submitting an existing consent returns the existing record without creating duplicates
- IP address captured at signing time for audit purposes
- Admin panel at `/admin/consents` shows all signed waivers with email/yoga type filters and statistics

### Policies Page
- Static informational page at `/[locale]/policies` covering studio rules and legal terms
- Bilingual (English/Chinese) with full next-intl translation support
- Seven policy sections: Health & Safety, Class Rules, Payment, Payment Verification, Multi-Session Packages, Cancellation & Refund Policy, and Contact Us
- No backend required — server-side rendered from translation files

### Contact Inquiry System
- Floating contact widget available site-wide for user inquiries
- Bilingual contact form with categorization (scheduling, general, business)
- Automatic email confirmations to users and admin notifications
- Admin panel for inquiry management with status tracking (open/in_progress/resolved/closed)
- Reply functionality with email delivery tracking and conversation history
- Statistics dashboard showing inquiry counts by status and category
- Filtering and pagination for inquiry list management

### Payment System (WeChat Pay - Static QR Code)
- Admin uploads personal WeChat Pay QR code image
- Per-session pricing on classes with optional multi-session discount packages
- Automatic payment record creation with unique reference numbers (format: "EY-YYYYMMDD-XXXX")
- User payment page with QR code display, amount, copyable reference number, and bilingual instructions
- Admin payment management panel with status filtering and bulk overview
- Manual payment confirmation/cancellation by admin with notes
- Payment status check page for users via reference number
- Bilingual payment emails (pending + confirmed)
- Free classes (price=null) bypass the entire payment flow

### Registration Tracking (Magic Link)
- Persistent tracking token per email address (64-char hex, cryptographically random)
- Token created on first registration, reused for all subsequent registrations from the same email
- Tracking link included in all registration/payment emails (`{{tracking_url}}` template variable)
- Tracking page at `/[locale]/track/{token}` shows all registrations for that email with class info, dates, status, and payment details
- Recovery page at `/[locale]/track` lets users request the link again by entering their email (always returns success to prevent email enumeration)
- Recovery sends a `tracking_link_request` email template with the tracking URL

### Email Notifications
- SMTP configuration for production email sending
- Development mode prints emails to console (when SMTP credentials are not set)
- Customizable notification templates
- Registration confirmation emails (includes tracking URL)
- Payment pending emails (amount, reference number, instructions, tracking URL)
- Payment confirmed emails (includes tracking URL)
- Tracking link request emails (sent from recovery page)
- Contact inquiry confirmation emails (bilingual)
- Admin notification emails for new inquiries
- Reply emails with conversation threading

#### Email Setup (Local Development)

SMTP password is stored in **macOS Keychain** (never in `.env` or source files):

```bash
# One-time: store Gmail App Password in Keychain
security add-generic-password -a "enjoyyoga" -s "smtp-password" -w "your-gmail-app-password"

# Start server with email enabled
export SMTP_PASSWORD=$(security find-generic-password -a "enjoyyoga" -s "smtp-password" -w)
uv run uvicorn app.main:app --reload

# To update the password
security delete-generic-password -a "enjoyyoga" -s "smtp-password"
security add-generic-password -a "enjoyyoga" -s "smtp-password" -w "new-password"
```

Gmail requires a **Gmail App Password** (not your regular password):
1. Enable 2-Step Verification at [myaccount.google.com](https://myaccount.google.com) → Security
2. Go to Security → 2-Step Verification → App passwords
3. Create an app password for "Mail" and use the 16-character code

Without `SMTP_PASSWORD` set, the server runs in dev mode and prints emails to console.

#### Email Setup (Production) — TODO

For production deployments, migrate from Gmail to a cloud secret manager:
- **AWS**: Use AWS Secrets Manager or SSM Parameter Store; load via IAM role
- **GCP**: Use GCP Secret Manager; load via service account
- **Azure**: Use Azure Key Vault
- **Self-hosted**: Use HashiCorp Vault or similar

The SMTP provider should also be upgraded from personal Gmail to a transactional email service (e.g., AWS SES, SendGrid, Mailgun, Postmark) for better deliverability, higher sending limits, and a professional sender domain.

## Production Deployment — TODO

Checklist of tasks required before deploying to production:

### Secrets & Credentials
- [ ] Migrate SMTP password from macOS Keychain to a cloud secret manager (AWS Secrets Manager, GCP Secret Manager, etc.)
- [ ] Set a strong, unique `JWT_SECRET_KEY` (not the default)
- [ ] Configure `CORS_ORIGINS` to only allow the production frontend domain
- [ ] Set `FRONTEND_URL` to the production frontend URL
- [ ] Set `SERVER_URL` to the production backend URL

### Email
- [ ] Replace personal Gmail with a transactional email service (AWS SES, SendGrid, Mailgun, or Postmark)
- [ ] Set up a professional sender domain with SPF, DKIM, and DMARC records
- [ ] Update `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL` for the new provider

### Database & Templates
- [ ] Run database migrations: `uv run alembic upgrade head`
- [ ] Seed admin user: `uv run python setup_admin.py`
- [ ] Seed email templates: `uv run python setup_contact_templates.py`
- [ ] Seed payment templates: `uv run python setup_payment_templates.py`
- [ ] Review and customize email template content via admin panel (default templates are basic)

### Infrastructure
- [ ] Set up PostgreSQL with proper backups and connection pooling
- [ ] Configure HTTPS for both frontend and backend
- [ ] Set up logging and monitoring (replace console `print` statements with proper logging)
- [ ] Configure rate limiting on public endpoints (registration, contact, tracking recovery)

### Admin Panel
- JWT-protected admin routes
- Teacher management
- Class and registration oversight
- Payment management with confirm/cancel actions
- Payment settings (QR code upload, bilingual instructions)
- Contact inquiry management with reply functionality
- Consent records management with email/yoga type filtering and statistics
- Statistics dashboard for inquiries, payments, and consents
- Notification template editing

## Development Notes

### Debugging Protocol
**IMPORTANT**: When debugging issues that require starting backend/frontend servers or components:
- Always stop both backend and frontend servers after debugging is complete
- Use `Ctrl+C` to stop running processes in terminals
- Ensure no processes are left running unnecessarily after debugging sessions
- This prevents resource consumption and port conflicts for future development

### Database Migrations
Use Alembic for all schema changes. Models inherit from `Base` defined in `app/models/yoga_type.py`.

### API Patterns
- All routes return JSON responses
- Async database operations throughout
- Pydantic schemas for validation
- Consistent error handling

### Internationalization
- All user-facing content stored in bilingual format (name_en/name_zh, description_en/description_zh)
- Frontend routing includes locale parameter: `/en/classes`, `/zh/classes`
- Translation files in `src/messages/en.json` and `src/messages/zh.json`

### Service Layer
Business logic isolated in service classes:
- `RegistrationService` - Handles class registration with email notifications and payment-aware status
- `PaymentService` - Payment CRUD, reference number generation, confirm/cancel flows, package management, payment settings
- `ContactService` - Manages contact inquiries, replies, and statistics
- `ConsentService` - Checks, creates, and lists consent records; enforces email normalisation and idempotency
- `TrackingService` - Creates/retrieves per-email tracking tokens, builds tracking URLs for magic link access
- `NotificationService` - Manages email sending (SMTP or console output) including payment, inquiry, and tracking link notifications
- `ScheduleParser` - Parses complex scheduling strings into class sessions

### Frontend State Management
- API calls through custom hooks in `src/lib/`
- Form handling with controlled components
- Loading and error states managed at component level

## Testing

### Backend Unit Tests

The backend includes comprehensive unit tests covering all business logic:

**Test Coverage (170+ tests)**:
- ✅ `ScheduleParserService` - Schedule parsing and validation logic (30 tests)
- ✅ `RegistrationService` - Registration management with capacity validation (17 tests)
- ✅ `NotificationService` - Email notifications and template management (16 tests)
- ✅ `Authentication` - JWT tokens, password hashing, admin auth (26 tests)
- ✅ `Admin Router` - Protected routes, dashboard stats, payment integration (39 tests)
- ✅ `Registrations Router` - Registration endpoints, validation, payment flow (18 tests)
- ✅ `ConsentService` - Consent creation, check, email normalisation, idempotency (10+ tests)
- ✅ `Consent Router` - Public and admin consent endpoints (17 tests)

**Key Features**:
- In-memory SQLite database for fast test execution
- Complete fixtures for all models and relationships
- Async test support with pytest-asyncio
- Mocked external dependencies (SMTP, etc.)
- Comprehensive error handling and edge case coverage

**Test Structure**:
```
backend/tests/
├── conftest.py                 # Test configuration & fixtures
├── unit/
│   ├── test_auth.py           # Authentication & security tests
│   ├── services/
│   │   ├── test_schedule_parser.py     # Schedule parsing logic
│   │   ├── test_registration_service.py # Registration business logic
│   │   ├── test_notification_service.py # Email notification logic
│   │   └── test_consent_service.py     # Consent creation and lookup logic
│   └── routers/
│       ├── test_admin.py       # Admin API endpoints
│       ├── test_registrations.py # Registration API endpoints
│       └── test_consent.py     # Public & admin consent endpoints
└── README.md                   # Detailed testing documentation
```

**Running Tests**:
- All tests: `uv run pytest`
- Verbose output: `uv run pytest -v`
- Specific test file: `uv run pytest tests/unit/test_auth.py`
- With coverage: `uv run pytest --cov=app --cov-report=html`
- Service tests only: `uv run pytest tests/unit/services/`

**Business Logic Coverage**:
- Schedule string parsing with regex validation
- Registration capacity management and waitlist logic
- Email template variable substitution and bilingual support
- JWT authentication and password security
- Admin dashboard statistics and user management
- Input validation, error handling, and edge cases

### Frontend Unit Tests

The frontend includes comprehensive unit tests covering all UI components and client-side logic:

**Test Coverage (105+ tests)**:
- ✅ `API Clients` - Complete API integration testing (52 tests)
  - Public API endpoints (classes, teachers, registrations, contact, payments, consent)
  - Admin API endpoints with JWT authentication (payments, payment settings, packages)
  - Error handling scenarios (401, 404, 500 responses)
  - Request/response validation and header verification
- ✅ `InquiriesClient` - Complex admin component testing (28 tests)
  - State management and API integration
  - Modal interactions and form validation
  - Statistics display and filtering logic
  - Reply functionality with email status tracking
- ✅ `ConsentModal` - Consent form modal testing (25+ tests)
  - Modal visibility, waiver text rendering
  - Checkbox enabling, name editing, read-only email
  - Submission: API calls, success/error handling, loading states
  - Modal closing behaviour
- ✅ `Bilingual Support` - Internationalization testing (2 tests)
  - English/Chinese content rendering
  - Translation key validation

**Key Features**:
- **Vitest + React Testing Library** - Modern testing stack (10-20x faster than Jest)
- **MSW (Mock Service Worker)** - Network-level API mocking without stubbing
- **Bilingual Testing** - Complete next-intl integration for English/Chinese
- **Component Integration** - Real component behavior with mocked APIs
- **User Interaction Testing** - Click events, form inputs, modal workflows

**Test Structure**:
```
frontend/src/
├── __tests__/                  # Main test directory
│   ├── components/
│   │   ├── admin/
│   │   │   └── InquiriesClient.test.tsx  # Complex admin component (25 tests)
│   │   ├── contact/            # Contact form components (planned)
│   │   └── forms/
│   │       ├── ConsentModal.test.tsx     # Consent modal component (25+ tests)
│   │       └── RegistrationForm.test.tsx # Registration form with consent flow
│   └── lib/
│       ├── api.test.ts         # Public API client (26 tests)
│       └── admin-api.test.ts   # Admin API client (26 tests)
└── test/                       # Test utilities and config
    ├── setup.ts               # Global test configuration
    ├── utils.tsx              # React Testing Library utilities with i18n
    └── mocks/
        ├── handlers.ts         # MSW API handlers (consent endpoints included)
        ├── server.ts          # MSW server setup
        ├── auth.ts            # Authentication testing utilities
        └── next-intl.ts       # Internationalization mocks
```

**Running Tests**:
- All tests: `npm run test`
- Watch mode: `npm run test:watch`
- Single run: `npm test -- --run`
- Coverage report: `npm run test:coverage`
- Interactive UI: `npm run test:ui`
- Specific component: `npm test -- InquiriesClient`
- Pattern matching: `npm test -- -t "should render"`
- Verbose output: `npm test -- --reporter=verbose`

**Testing Capabilities**:
- **API Integration** - All endpoints with authentication and error scenarios
- **Component Rendering** - React structure and content validation
- **User Interactions** - Click, type, form submission, navigation events
- **State Management** - Async updates, loading states, error handling
- **Modal Workflows** - Complex UI interactions and component communication
- **Form Validation** - Input validation, error messages, submission flows
- **File Uploads** - Multipart form data and file handling
- **Internationalization** - Bilingual content and locale switching
- **Authentication** - JWT tokens, admin sessions, protected routes
- **Error Boundaries** - Component error handling and recovery

**Performance & Quality**:
- **Fast Execution**: Complete test suite runs in ~2 seconds
- **High Coverage**: 100% test pass rate (105+/105+ tests)
- **Modern Stack**: ESM support, TypeScript integration, React 19 compatibility
- **Developer Experience**: Clear error messages, fast feedback loop
- **CI/CD Ready**: Designed for automated pipeline execution

## Contact Inquiry System

### Complete Feature Implementation

The contact inquiry system provides a comprehensive solution for managing customer inquiries with bilingual support, admin management, and email notifications.

### Database Models

**ContactInquiry** (`app/models/contact_inquiry.py`):
- **Fields**: id (UUID), name, email, phone, subject, message, category, status, preferred_language, admin_notes, timestamps
- **Categories**: "scheduling", "general", "business"
- **Status Flow**: "open" → "in_progress" → "resolved" → "closed"
- **Languages**: "en" (English), "zh" (Chinese)

**InquiryReply** (`app/models/inquiry_reply.py`):
- **Fields**: id (UUID), inquiry_id, admin_id, subject, message, email_status, error_message, timestamps
- **Email Status**: "pending" → "sent" or "failed"
- **Relationships**: Many-to-one with ContactInquiry and AdminUser

### API Endpoints

**Public Contact API** (`/api/contact`):
- `POST /inquiries` - Submit new contact inquiry (auto-sends confirmation and admin notification)

**Admin Contact API** (`/api/admin/contact` - JWT protected):
- `GET /inquiries` - List inquiries with filtering (status, category) and pagination
- `GET /inquiries/{id}` - Get specific inquiry with reply history
- `PUT /inquiries/{id}` - Update inquiry status and admin notes
- `GET /stats` - Get inquiry statistics (total, by status, by category)
- `POST /inquiries/{id}/replies` - Create reply (auto-sends email to user)

### Frontend Components

**Public Interface**:
- **ContactWidget** (`src/components/contact/ContactWidget.tsx`) - Floating contact button (bottom-right)
- **ContactModal** (`src/components/contact/ContactModal.tsx`) - Contact form modal with bilingual support

**Admin Interface**:
- **InquiriesClient** (`src/components/admin/InquiriesClient.tsx`) - Complete inquiry management with:
  - Statistics cards (total, open, in_progress, resolved counts)
  - Filterable list view (status, category)
  - Detail modal with inquiry info and reply composition
  - Reply history with email delivery status
- **Admin Page** (`src/app/[locale]/admin/inquiries/page.tsx`) - Admin inquiries route

### Email Templates

**Template Types** (setup via `setup_contact_templates.py`):
1. **inquiry_confirmation** - User confirmation (bilingual)
2. **admin_inquiry_notification** - Admin alert (English only)
3. **inquiry_reply** - Admin reply to user (respects user's language preference)

**Template Variables**: name, email, subject, category, inquiry_id, message, phone, preferred_language, etc.

### Service Layer

**ContactService** (`app/services/contact_service.py`):
- `create_inquiry()` - Creates inquiry with email notifications
- `get_inquiry_by_id()` - Retrieves inquiry with replies
- `get_all_inquiries()` - Lists with filtering and pagination
- `update_inquiry()` - Updates status and admin notes
- `get_inquiry_stats()` - Returns statistics object
- `create_reply()` - Creates reply with email sending
- `update_reply_status()` - Updates email delivery status

**NotificationService Extensions**:
- `send_inquiry_confirmation_email()` - User confirmation (language-aware)
- `send_admin_inquiry_notification()` - Admin alert
- `send_inquiry_reply_email()` - Reply delivery (language-aware)

### User Flow

1. **Contact Submission**:
   - User clicks floating "Contact Us" button
   - Modal opens with categorized form
   - User submits inquiry
   - System sends confirmation email to user
   - System sends notification email to admin
   - Modal shows success message and auto-closes

2. **Admin Management**:
   - Admin navigates to `/admin/inquiries`
   - Views statistics dashboard and inquiry list
   - Filters by status/category as needed
   - Clicks inquiry to view details and reply history
   - Updates status and adds admin notes
   - Composes and sends replies to users
   - Tracks email delivery status

### Key Features

- **Bilingual Support**: Forms, emails, and admin interface support English/Chinese
- **Categorization**: Inquiries categorized as scheduling/general/business for better organization
- **Status Tracking**: Complete lifecycle from open to closed with admin notes
- **Email Integration**: Automatic confirmations and notifications with delivery tracking
- **Statistics Dashboard**: Real-time counts and filtering for admin efficiency
- **Reply System**: Full conversation history with email threading
- **Responsive Design**: Mobile-friendly contact widget and admin interface

## Payment System (WeChat Pay - Static QR Code)

### Complete Feature Implementation

The payment system enables class pricing with WeChat Pay support using a static QR code approach (personal WeChat account, no merchant API). Admin uploads their WeChat Pay QR code, sets class prices, and manually confirms payments after users scan and pay.

### Payment Flow

1. **Admin Setup**: Upload WeChat QR code image in Payment Settings, set per-session price on classes, optionally create multi-session discount packages
2. **User Registration**: User registers for a priced class → registration status = `pending_payment`
3. **Payment Page**: User sees payment page with QR code, amount, reference number, and bilingual instructions
4. **User Payment**: User scans QR code with WeChat, pays the amount, includes reference number in payment note
5. **Admin Verification**: Admin sees pending payments in admin panel → verifies payment in WeChat → confirms in admin panel
6. **Completion**: Registration status changes to `confirmed`, confirmation email sent to user
7. **Free Classes**: Classes with `price=null` continue to work exactly as before — no payment flow triggered

### Database Models

**ClassPackage** (`app/models/class_package.py`):
- **Fields**: id (UUID), class_id (FK), name_en, name_zh, description_en, description_zh, session_count, price, currency, is_active, created_at
- **Relationships**: Many-to-one with YogaClass

**Payment** (`app/models/payment.py`):
- **Fields**: id (UUID), registration_id (FK, nullable), amount, currency, payment_method, status, reference_number (unique), payment_type, package_id (FK, nullable), admin_notes, confirmed_by (FK), confirmed_at, created_at
- **Status Flow**: "pending" → "confirmed" | "cancelled" | "refunded"
- **Payment Types**: "single_session", "package"
- **Reference Number Format**: "EY-YYYYMMDD-XXXX" (e.g., "EY-20260215-AB3X")
- **Relationships**: One-to-one with Registration, many-to-one with ClassPackage and AdminUser

**PaymentSettings** (`app/models/payment_settings.py`):
- **Fields**: id (UUID), wechat_qr_code_url, payment_instructions_en, payment_instructions_zh, updated_at
- **Pattern**: Singleton row for global payment configuration

### API Endpoints

**Public Payment API** (`/api/payments`):
- `GET /status/{reference_number}` - Check payment status by reference number
- `GET /settings` - Get payment settings (QR code URL, instructions)
- `GET /registration/{registration_id}` - Get payment info for a registration

**Admin Payment API** (`/api/admin` - JWT protected):
- `GET /payments` - List payments with optional status filter
- `GET /payments/pending` - List pending payments only
- `GET /payments/stats` - Payment statistics (totals, counts, revenue)
- `GET /payments/{id}` - Single payment detail
- `POST /payments/{id}/confirm` - Confirm payment (updates registration to confirmed)
- `POST /payments/{id}/cancel` - Cancel payment (updates registration to cancelled)
- `GET /packages/{class_id}` - List packages for a class
- `POST /packages` - Create a new package
- `PUT /packages/{id}` - Update a package
- `GET /payment-settings` - Get payment settings (admin)
- `PUT /payment-settings` - Update payment instructions
- `POST /payment-settings/qr-code` - Upload WeChat QR code image

### Frontend Components

**Public Interface**:
- **Payment Page** (`src/app/[locale]/payment/[registrationId]/page.tsx`) - QR code display, amount, reference number, instructions, status
- **Payment Status Page** (`src/app/[locale]/payment/status/page.tsx`) - Check payment status by reference number
- **RegistrationForm** (`src/components/forms/RegistrationForm.tsx`) - Price display, package selection, payment redirect
- **Class Pages** - Show per-session price and available packages with savings percentages

**Admin Interface**:
- **PaymentsClient** (`src/components/admin/PaymentsClient.tsx`) - Payment management with:
  - Statistics cards (total, pending, confirmed, revenue)
  - Status filter tabs
  - Payment list with detail modal
  - Confirm/cancel actions with admin notes
- **PaymentSettingsClient** (`src/components/admin/PaymentSettingsClient.tsx`) - Payment settings with:
  - QR code upload with preview
  - Payment instructions text areas (English + Chinese)
  - Save button

### Email Templates

**Template Types** (setup via `setup_payment_templates.py`):
1. **payment_pending** - Sent to user after registration for paid class (amount, reference number, instructions)
2. **payment_confirmed** - Sent to user when admin confirms payment

Also added to `NotificationService.create_default_templates()`.

### Service Layer

**PaymentService** (`app/services/payment_service.py`):
- `generate_reference_number()` - Creates unique "EY-YYYYMMDD-XXXX" reference
- `create_payment_for_registration()` - Creates Payment with status="pending"
- `confirm_payment()` - Sets payment confirmed + registration confirmed + sends email
- `cancel_payment()` - Sets payment cancelled + registration cancelled
- `get_payment_by_id/reference/registration()` - Retrieval methods
- `get_pending_payments()`, `get_all_payments()` - List methods with filtering
- `get_payment_stats()` - Totals/counts for dashboard
- `create_package()`, `update_package()`, `get_packages_for_class()` - Package CRUD
- `get_payment_settings()`, `update_payment_settings()` - Settings management

**RegistrationService Modifications**:
- Sets `status="pending_payment"` for classes with price > 0
- Includes `"pending_payment"` in capacity count alongside "confirmed"

**NotificationService Extensions**:
- `send_payment_pending_email()` - Payment instructions (language-aware)
- `send_payment_confirmed_email()` - Confirmation notification (language-aware)

### Backward Compatibility

- Existing classes: `price=None` → free, no payment flow triggered
- Existing registrations: `status="confirmed"`, no Payment record → unchanged
- New schema fields all have defaults (`price=None`, `currency="CNY"`)
- Registration status extended: `"pending_payment"` added alongside existing values

## Consent Form System

### Complete Feature Implementation

The consent form system requires users to sign a yoga-type-specific health & liability waiver before registering for any class. Consent is scoped per email + yoga type (not per class), so users sign once per yoga type and never need to re-sign for the same type.

### Database Model

**ConsentRecord** (`app/models/consent_record.py`):
- **Fields**: id (UUID), email (String 300, indexed), name (String 200), yoga_type_id (FK to yoga_types), consent_text_version (String 50, default "1.0"), ip_address (String 45, nullable), user_id (UUID, nullable), signed_at (DateTime with timezone)
- **Unique Constraint**: `(email, yoga_type_id)` — one consent per email per yoga type
- **Migration**: `alembic/versions/b647922abf3c_add_consent_records_table.py`

### Schemas (`app/schemas/consent.py`)

- `ConsentCreate` — email, name, yoga_type_id, consent_text_version
- `ConsentOut` — full record including signed_at timestamp
- `ConsentCheckResult` — `{has_consent: bool, consent: Optional[ConsentOut]}`
- `ConsentListItem` — for admin list view with yoga type names

### API Endpoints (`app/routers/consent.py`)

**Public Consent API** (`/api/consent`):
- `GET /check?email=...&yoga_type_id=...` - Check whether a consent record exists
- `POST /sign` - Sign the waiver (creates record if absent, returns existing if duplicate; captures client IP)

**Admin Consent API** (`/api/admin/consent` - JWT protected):
- `GET /consents` - List all consent records with optional email/yoga_type filtering and pagination
- `GET /stats` - Consent statistics grouped by yoga type

### Service Layer

**ConsentService** (`app/services/consent_service.py`):
- `check_consent(email, yoga_type_id)` — Returns `ConsentCheckResult`; emails are normalised (lowercased, stripped) before lookup
- `create_consent(data, ip_address)` — Idempotent: returns existing record if already signed, otherwise inserts new record
- `get_all_consents(filters, limit, offset)` — Lists consents with optional email/yoga_type filter and pagination
- `get_consent_stats()` — Returns total count and per-yoga-type breakdown

### Frontend Components

**Public Interface**:
- **ConsentForm** (`src/components/forms/ConsentForm.tsx`) — Standalone form for the dedicated consent page. Includes yoga type selector, waiver text, name/email inputs, agree checkbox, and post-sign "Register for a Class" CTA.
- **ConsentModal** (`src/components/forms/ConsentModal.tsx`) — Modal version for inline signing during registration. Name/email are pre-filled and email is read-only. Calls `signConsent()` on submission.
- **Consent Page** (`src/app/[locale]/consent/page.tsx`) — Route `/[locale]/consent`; accepts `yoga_type_id` and `return_url` query params; redirects to return URL after signing.

**Registration Integration** (`src/components/forms/RegistrationForm.tsx`):
- Checks consent status whenever email or class changes
- Shows a warning banner if consent is missing for the class's yoga type
- "Sign Waiver" button opens ConsentModal with name/email pre-filled
- Form submission is disabled until consent is confirmed

**Admin Interface**:
- **ConsentsClient** (`src/components/admin/ConsentsClient.tsx`) — Statistics cards (total + per yoga type), email filter input, yoga type dropdown filter, consent records table (Name, Email, Yoga Type, Version, Signed At)
- **Admin Page** (`src/app/[locale]/admin/consents/page.tsx`) — Route `/[locale]/admin/consents`
- **AdminSidebar** — Navigation link to `/[locale]/admin/consents`

**API Client** (`src/lib/api.ts`):
- `checkConsent(email, yogaTypeId)` — GET `/api/consent/check`
- `signConsent(data)` — POST `/api/consent/sign`

### User Flow

1. User begins registering for a class
2. Registration form checks consent status for the class's yoga type against the entered email
3. If no consent found, a warning banner appears and submission is blocked
4. User clicks "Sign Waiver" → ConsentModal opens with name/email pre-filled
5. User reads waiver, checks agree box, submits → `POST /api/consent/sign`
6. Modal closes, form re-checks consent status, submission unblocked
7. Alternatively, user visits `/[locale]/consent` directly and signs with a yoga type selector

### Key Implementation Details

- **Idempotency**: Submitting the same email + yoga type twice returns the existing record without error
- **Email Normalisation**: All email addresses are lowercased and whitespace-stripped before storage and lookup
- **IP Capture**: Client IP address is recorded at signing time for audit purposes
- **Yoga Type Scoping**: Users must sign separately for each yoga type they register for (e.g., Hatha and Vinyasa require separate waivers)
- **Bilingual Support**: Waiver text, form labels, and admin interface fully localised in English and Chinese

### Translations

`src/messages/en.json` and `src/messages/zh.json` contain keys under `"consent"` (public form) and `"admin.consents"` (admin panel):
- Public: title, waiver text, form fields, success message, error text, modal labels, registration warning
- Admin: statistics cards, filter labels, table column headers

## Policies Page

### Overview

A static bilingual informational page at `/[locale]/policies` that communicates studio rules, payment procedures, and cancellation terms to users. No backend is required — all content is served from next-intl translation files.

### Frontend Page

**Policies Page** (`src/app/[locale]/policies/page.tsx`):
- Route: `/en/policies` and `/zh/policies`
- Server-side rendered with next-intl
- Seven policy sections displayed as styled cards

### Policy Sections

| Section | Key Topics |
|---------|-----------|
| **Health & Safety** | Consult doctor before starting; inform instructor of limitations; participation at own risk |
| **Class Rules** | Arrive 5–10 min early; silence phone; remove shoes; no recording without permission |
| **Payment** | WeChat Pay via QR code; unique reference number per registration; admin manual verification |
| **Payment Verification** | Admin verifies within 1 business day; confirmation email sent; contact us if no response |
| **Multi-Session Packages** | Class-specific; non-transferable; partially used packages non-refundable; must use within validity period |
| **Cancellation & Refund** | Full refund ≥24 h before class; no refund within 24 h; use Contact Us to cancel |
| **Contact Us** | Floating contact widget (bottom-right); categories: scheduling, payments, general, business |

### Translations

`src/messages/en.json` and `src/messages/zh.json` both contain a `"policies"` key with all section titles and body text. Navigation also uses `"nav.policies"` key for the link label.

## Registration Tracking System (Magic Link)

### Overview

The registration tracking system gives users a persistent, secure way to check the status of all their registrations and payments without needing an account. A unique magic link (tracking URL) is included in every registration and payment email. Users who lose the link can recover it via a simple email form.

### Database Model

**TrackingToken** (`app/models/tracking_token.py`):
- **Fields**: id (UUID PK), email (String 300, unique, indexed), token (String 64, unique, indexed, default `secrets.token_hex(32)`), created_at (DateTime with timezone)
- **Pattern**: One token per email address — created on first registration, reused for all subsequent ones
- **Migration**: `alembic/versions/268f5619f962_add_tracking_tokens_table.py`

### Schemas (`app/schemas/tracking.py`)

- `TrackingRegistrationItem` — registration_id, class_name_en/zh, status, target_date/time, created_at, payment_status, reference_number, amount, currency
- `TrackingResponse` — email, registrations list, total count
- `TrackingLinkRequest` — email, preferred_language

### API Endpoints (`app/routers/tracking.py`)

**Public Tracking API** (`/api/track`):
- `GET /{token}` — Returns all registrations for the email associated with this token (with class info and payment details). Returns 404 for invalid tokens.
- `POST /request-link` — Accepts email and preferred_language, sends tracking link email. Always returns 200 to prevent email enumeration.

### Service Layer

**TrackingService** (`app/services/tracking_service.py`):
- `get_or_create_token(email, db)` — Normalizes email (lowercase + strip), returns existing or creates new `TrackingToken`
- `get_email_by_token(token, db)` — Returns email or None
- `build_tracking_url(token, locale)` — Returns `{frontend_url}/{locale}/track/{token}`

**NotificationService Extensions**:
- `send_tracking_link_email(email, tracking_url, preferred_language, db)` — Sends email with tracking link (for recovery page)
- `send_confirmation_email()`, `send_payment_pending_email()`, `send_payment_confirmed_email()` — All accept optional `tracking_url` parameter, included in template variables

### Configuration

- `frontend_url` setting added to `app/config.py` (default: `http://localhost:3000`) — used to build tracking URLs
- Set via `FRONTEND_URL` environment variable in production

### Email Integration

All registration/payment emails now include a `{{tracking_url}}` template variable. The tracking URL is generated during:
1. **Registration creation** (`app/routers/registrations.py`) — passed to both `send_confirmation_email()` and `send_payment_pending_email()`
2. **Payment confirmation** (`app/routers/payments.py`) — passed to `send_payment_confirmed_email()`

A new `tracking_link_request` email template is added to `NotificationService.create_default_templates()` for the recovery flow.

> **Note:** Existing templates in DB won't auto-update (idempotent creation). To add `{{tracking_url}}` to live deployments, delete old template rows or edit via admin panel.

### Frontend Pages

**Tracking Page** (`src/app/[locale]/track/[token]/page.tsx`):
- Client component, calls `getRegistrationsByToken(token)` on mount
- Displays email identifier, list of registration cards with: class name (locale-aware), date, time, status badge, payment info (status, reference number, amount)
- Links to recovery page in footer
- Shows error state for invalid tokens

**Recovery Page** (`src/app/[locale]/track/page.tsx`):
- Client component with email input form
- Calls `requestTrackingLink(email, locale)` on submit
- Always shows success message after submit (prevents email enumeration)

**API Client** (`src/lib/api.ts`):
- `getRegistrationsByToken(token)` — GET `/api/track/{token}`
- `requestTrackingLink(email, preferredLanguage)` — POST `/api/track/request-link`

### User Flow

1. User registers for a class
2. System creates/retrieves a tracking token for the user's email
3. Tracking URL is included in the confirmation or payment email
4. User clicks the link → sees all their registrations with status and payment details
5. If the link is lost, user visits `/[locale]/track`, enters their email, and receives a new email with the link

### Translations

`src/messages/en.json` and `src/messages/zh.json` contain keys under `"tracking"`:
- Page titles, subtitle, loading/error messages
- Registration card labels (class, date, time, status, payment, reference, amount)
- Status labels (confirmed, pending payment, waitlist, cancelled)
- Payment status labels (paid, pending, cancelled)
- Recovery form: title, subtitle, email field, submit button, success/error messages