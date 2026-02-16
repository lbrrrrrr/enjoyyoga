# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

enjoyyoga is a bilingual (English/Chinese) yoga business management application with class listings, teacher profiles, yoga type descriptions, class registration system, WeChat Pay integration (static QR code), and contact inquiry management with email notifications and admin reply functionality.

## Development Commands

### Backend (FastAPI + PostgreSQL)

```bash
# Setup (run once)
cd backend
uv sync
cp .env.example .env  # Edit with database credentials
uv run alembic upgrade head

# Start development server
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

## GitHub Actions

### Automated PR Reviews

The repository includes automated code review using Claude AI for all pull requests.

**Setup**:
1. Get Claude API key from [console.anthropic.com](https://console.anthropic.com)
2. Add `ANTHROPIC_API_KEY` secret in GitHub repository settings
3. Open a PR to trigger automatic review

**Features**:
- Triggers on PR open, update, and reopen
- Reviews for security, bugs, code quality, and best practices
- Posts detailed feedback as PR comments
- Handles large PRs gracefully (>100KB diffs skipped)
- Uses Claude Sonnet 4.5 for comprehensive analysis

See `.github/workflows/README.md` for detailed setup instructions.

## Architecture

### Backend Structure

**Framework**: FastAPI with async SQLAlchemy ORM, PostgreSQL database

**Key Directories**:
- `app/models/` - SQLAlchemy models (yoga_class.py, teacher.py, registration.py, payment.py, class_package.py, payment_settings.py, contact_inquiry.py, inquiry_reply.py, etc.)
- `app/routers/` - FastAPI route handlers (classes.py, teachers.py, admin.py, payments.py, contact.py, etc.)
- `app/schemas/` - Pydantic models for request/response validation (payment.py, contact.py, etc.)
- `app/services/` - Business logic (registration_service.py, payment_service.py, notification_service.py, schedule_parser.py, contact_service.py)
- `alembic/` - Database migration files

**Authentication**: JWT-based admin authentication in `app/auth.py`

**Configuration**: Environment-based settings in `app/config.py` (database URL, CORS, JWT, SMTP)

**Entry Point**: `app/main.py` - FastAPI application setup with CORS and router inclusion

### Frontend Structure

**Framework**: Next.js 15 App Router with TypeScript, Tailwind CSS, shadcn/ui components

**Internationalization**: next-intl with English/Chinese locales using `[locale]` dynamic routing

**Key Directories**:
- `src/app/[locale]/` - Internationalized pages (admin/, classes/, teachers/, payment/, admin/inquiries/, admin/payments/, admin/payment-settings/, etc.)
- `src/components/` - Reusable UI components (built with shadcn/ui, includes contact/ and admin/ subdirectories for PaymentsClient, PaymentSettingsClient, etc.)
- `src/lib/` - Utility functions and API clients
- `src/messages/` - Translation files for English/Chinese
- `src/i18n/` - Internationalization configuration

**Admin Panel**: Located at `/[locale]/admin/` with protected routes for dashboard, teachers, registrations, payments, payment settings, contact inquiries, and notifications

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
- `AdminUser` - Admin authentication
- `NotificationTemplate` - Email template management

**Relationships**: Classes belong to teachers and yoga types; classes have many packages; registrations link students to specific class sessions and have an optional payment; payments reference packages and are confirmed by admin users; contact inquiries have many replies from admin users

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

### Email Notifications
- SMTP configuration for production email sending
- Development mode prints emails to console
- Customizable notification templates
- Registration confirmation emails
- Payment pending emails (amount, reference number, instructions)
- Payment confirmed emails
- Contact inquiry confirmation emails (bilingual)
- Admin notification emails for new inquiries
- Reply emails with conversation threading

### Admin Panel
- JWT-protected admin routes
- Teacher management
- Class and registration oversight
- Payment management with confirm/cancel actions
- Payment settings (QR code upload, bilingual instructions)
- Contact inquiry management with reply functionality
- Statistics dashboard for inquiries and payments
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
- `NotificationService` - Manages email sending (SMTP or console output) including payment and inquiry notifications
- `ScheduleParser` - Parses complex scheduling strings into class sessions

### Frontend State Management
- API calls through custom hooks in `src/lib/`
- Form handling with controlled components
- Loading and error states managed at component level

## Testing

### Backend Unit Tests

The backend includes comprehensive unit tests covering all business logic:

**Test Coverage (155 tests)**:
- ✅ `ScheduleParserService` - Schedule parsing and validation logic (30 tests)
- ✅ `RegistrationService` - Registration management with capacity validation (17 tests)
- ✅ `NotificationService` - Email notifications and template management (16 tests)
- ✅ `Authentication` - JWT tokens, password hashing, admin auth (26 tests)
- ✅ `Admin Router` - Protected routes, dashboard stats, payment integration (39 tests)
- ✅ `Registrations Router` - Registration endpoints, validation, payment flow (18 tests)

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
│   │   └── test_notification_service.py # Email notification logic
│   └── routers/
│       ├── test_admin.py       # Admin API endpoints
│       └── test_registrations.py # Registration API endpoints
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

**Test Coverage (80 tests)**:
- ✅ `API Clients` - Complete API integration testing (52 tests)
  - Public API endpoints (classes, teachers, registrations, contact, payments)
  - Admin API endpoints with JWT authentication (payments, payment settings, packages)
  - Error handling scenarios (401, 404, 500 responses)
  - Request/response validation and header verification
- ✅ `InquiriesClient` - Complex admin component testing (28 tests)
  - State management and API integration
  - Modal interactions and form validation
  - Statistics display and filtering logic
  - Reply functionality with email status tracking
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
│   │   └── forms/              # Registration forms (planned)
│   └── lib/
│       ├── api.test.ts         # Public API client (26 tests)
│       └── admin-api.test.ts   # Admin API client (26 tests)
└── test/                       # Test utilities and config
    ├── setup.ts               # Global test configuration
    ├── utils.tsx              # React Testing Library utilities with i18n
    └── mocks/
        ├── handlers.ts         # MSW API handlers (472 lines)
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
- **Fast Execution**: Complete test suite runs in ~1.7 seconds
- **High Coverage**: 100% test pass rate (80/80 tests)
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