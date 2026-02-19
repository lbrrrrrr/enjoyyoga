# CLAUDE.md

## Project Overview

enjoyyoga is a bilingual (English/Chinese) yoga business management app built with FastAPI + PostgreSQL (backend) and Next.js 15 + TypeScript (frontend). Features: class listings, teacher profiles, class registration with consent gating, WeChat Pay integration (static QR code with manual admin confirmation), contact inquiry management, registration tracking via magic link, and a policies page.

## Development Commands

### Backend (FastAPI + PostgreSQL)

```bash
# Setup (run once)
cd backend
uv sync
cp .env.example .env  # Edit with database credentials
uv run alembic upgrade head
uv run python setup_admin.py              # Admin user + default email templates
uv run python setup_contact_templates.py  # Contact inquiry email templates
uv run python setup_payment_templates.py  # Payment email templates

# Start dev server (with email)
cd backend
export SMTP_PASSWORD=$(security find-generic-password -a "enjoyyoga" -s "smtp-password" -w)
uv run uvicorn app.main:app --reload

# Start dev server (without email — prints to console)
cd backend
uv run uvicorn app.main:app --reload

# Database migrations
uv run alembic revision --autogenerate -m "description"
uv run alembic upgrade head
uv run alembic downgrade -1

# Tests
uv run pytest                          # All tests
uv run pytest -v                       # Verbose
uv run pytest --cov=app                # With coverage
uv run pytest tests/unit/services/     # Service layer only
```

### Frontend (Next.js 15 + TypeScript)

```bash
# Setup (run once)
cd frontend
npm install

# Dev / Build
npm run dev
npm run build && npm run start

# Tests
npm run test                    # All tests
npm run test:watch              # Watch mode
npm run test:coverage           # With coverage
npm test -- --run               # Single run
npm test -- InquiriesClient     # Specific file
```

### Full Dev Workflow

Two terminals simultaneously:
1. Backend: `cd backend && uv run uvicorn app.main:app --reload`
2. Frontend: `cd frontend && npm run dev`

## Architecture

### Backend

- **Framework**: FastAPI, async SQLAlchemy ORM, PostgreSQL
- **`app/models/`** — SQLAlchemy models (yoga_class, teacher, registration, payment, class_package, payment_settings, contact_inquiry, inquiry_reply, consent_record, tracking_token, etc.)
- **`app/routers/`** — Route handlers (classes, teachers, admin, payments, contact, consent, tracking)
- **`app/schemas/`** — Pydantic request/response validation
- **`app/services/`** — Business logic: RegistrationService, PaymentService, NotificationService, ContactService, ConsentService, TrackingService, ScheduleParser
- **`app/auth.py`** — JWT-based admin authentication
- **`app/config.py`** — Environment-based settings (DB, CORS, JWT, SMTP, frontend URL)
- **`alembic/`** — Database migrations

### Frontend

- **Framework**: Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui
- **`src/app/[locale]/`** — Internationalized pages with `[locale]` dynamic routing (next-intl)
- **`src/components/`** — UI components (includes `admin/`, `contact/`, `forms/` subdirectories)
- **`src/lib/`** — API clients and utilities
- **`src/messages/`** — Translation files (`en.json`, `zh.json`)

### Key Database Relationships

- Classes → Teacher, YogaType (belongs-to); Classes → ClassPackages (has-many)
- Registration → ClassSession (belongs-to); Registration → Payment (optional one-to-one)
- Payment → ClassPackage (optional); Payment → AdminUser (confirmed_by)
- ConsentRecord: unique constraint on (email, yoga_type_id) — one consent per email per yoga type
- TrackingToken: unique per email — one persistent token per email address
- ContactInquiry → InquiryReply (has-many)

## Key Conventions

### Bilingual Content
- All user-facing DB content is bilingual: `name_en`/`name_zh`, `description_en`/`description_zh`
- Frontend routing: `/en/classes`, `/zh/classes`
- Translations in `src/messages/en.json` and `src/messages/zh.json`

### Service Layer Pattern
Business logic is isolated in service classes (`app/services/`), not in routers. Routers handle HTTP concerns only.

### Registration Flow
- Free classes (`price=null`): registration → `confirmed` immediately
- Paid classes (`price > 0`): registration → `pending_payment` → payment page → admin confirms → `confirmed`
- Consent required: registration form checks consent for the class's yoga type; blocks submission if missing

### Payment Reference Numbers
Format: `EY-YYYYMMDD-XXXX` (e.g., "EY-20260215-AB3X"). Generated in `PaymentService.generate_reference_number()`.

### Email System
- SMTP configured via env vars; without `SMTP_PASSWORD`, emails print to console
- SMTP password stored in macOS Keychain: `security find-generic-password -a "enjoyyoga" -s "smtp-password" -w`
- Templates stored in DB (`NotificationTemplate`), support `{{variable}}` substitution
- All registration/payment emails include `{{tracking_url}}` for magic link tracking

### Consent System
- Scoped per email + yoga type (not per class)
- Idempotent: re-signing returns existing record
- Emails normalised (lowercased, stripped) before storage and lookup

### Tracking (Magic Link)
- One persistent token per email, created on first registration
- Tracking URL in all emails; recovery page at `/[locale]/track` (always returns 200 to prevent enumeration)

## Development Notes

### Debugging Protocol
**IMPORTANT**: Always stop backend/frontend servers after debugging. Prevents resource consumption and port conflicts.

### Database Migrations
Use Alembic for all schema changes. Models inherit from `Base` defined in `app/models/yoga_type.py`.

### API Patterns
- All routes return JSON; async DB operations throughout
- Pydantic schemas for validation; consistent error handling

### Git Hooks
**Auto PR Creation** (`.git/hooks/post-push`): Automatically creates a PR when pushing to non-main branches. Requires `gh` CLI.

### CI/CD
- GitHub Actions: `backend-tests.yml`, `frontend-tests.yml`, `claude-pr-review.yml`
- Tests run on every push to `main` and all PRs
- Claude PR Review requires `ANTHROPIC_API_KEY` secret in repo settings
- See `.github/workflows/README.md` for details

### Testing Stack
- **Backend**: pytest + pytest-asyncio, in-memory SQLite, mocked SMTP
- **Frontend**: Vitest + React Testing Library + MSW (Mock Service Worker)
