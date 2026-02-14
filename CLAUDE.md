# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

enjoyyoga is a bilingual (English/Chinese) yoga business management application with class listings, teacher profiles, yoga type descriptions, and a class registration system with email notifications.

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
```

### Full Development Workflow

Requires two terminals running simultaneously:
1. Backend: `cd backend && uv run uvicorn app.main:app --reload`
2. Frontend: `cd frontend && npm run dev`

## Architecture

### Backend Structure

**Framework**: FastAPI with async SQLAlchemy ORM, PostgreSQL database

**Key Directories**:
- `app/models/` - SQLAlchemy models (yoga_class.py, teacher.py, registration.py, etc.)
- `app/routers/` - FastAPI route handlers (classes.py, teachers.py, admin.py, etc.)
- `app/schemas/` - Pydantic models for request/response validation
- `app/services/` - Business logic (registration_service.py, notification_service.py, schedule_parser.py)
- `alembic/` - Database migration files

**Authentication**: JWT-based admin authentication in `app/auth.py`

**Configuration**: Environment-based settings in `app/config.py` (database URL, CORS, JWT, SMTP)

**Entry Point**: `app/main.py` - FastAPI application setup with CORS and router inclusion

### Frontend Structure

**Framework**: Next.js 15 App Router with TypeScript, Tailwind CSS, shadcn/ui components

**Internationalization**: next-intl with English/Chinese locales using `[locale]` dynamic routing

**Key Directories**:
- `src/app/[locale]/` - Internationalized pages (admin/, classes/, teachers/, etc.)
- `src/components/` - Reusable UI components (built with shadcn/ui)
- `src/lib/` - Utility functions and API clients
- `src/messages/` - Translation files for English/Chinese
- `src/i18n/` - Internationalization configuration

**Admin Panel**: Located at `/[locale]/admin/` with protected routes for dashboard, teachers, registrations, notifications

### Database Schema

**Core Models**:
- `YogaClass` - Class definitions with bilingual names/descriptions, scheduling data, teacher/type relationships
- `ClassSession` - Specific instances of classes with date/time
- `Teacher` - Teacher profiles with bilingual bios and credentials
- `YogaType` - Yoga style categories (Hatha, Vinyasa, etc.)
- `Registration` - Student class registrations with contact info
- `AdminUser` - Admin authentication
- `NotificationTemplate` - Email template management

**Relationships**: Classes belong to teachers and yoga types; registrations link students to specific class sessions

## Key Features

### Class Management
- Bilingual class definitions with scheduling
- Recurring and one-time class support
- Capacity management and registration tracking
- Schedule parsing for complex recurring patterns

### Registration System
- Student registration with contact information
- Optional schedule selection for recurring classes
- Email confirmation notifications
- Admin dashboard for registration management

### Email Notifications
- SMTP configuration for production email sending
- Development mode prints emails to console
- Customizable notification templates
- Registration confirmation emails

### Admin Panel
- JWT-protected admin routes
- Teacher management
- Class and registration oversight
- Notification template editing

## Development Notes

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
- `RegistrationService` - Handles class registration with email notifications
- `NotificationService` - Manages email sending (SMTP or console output)
- `ScheduleParser` - Parses complex scheduling strings into class sessions

### Frontend State Management
- API calls through custom hooks in `src/lib/`
- Form handling with controlled components
- Loading and error states managed at component level