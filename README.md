# enjoyyoga

A bilingual (English/Chinese) web application for yoga class management, featuring class listings, teacher profiles, online registration, payment integration, and contact inquiry management.

## Features

- 📅 **Class Management** - Browse yoga classes with schedules, pricing, and teacher information
- 👤 **Teacher Profiles** - Detailed bilingual teacher bios and specializations
- 📝 **Online Registration** - Seamless class registration with capacity management
- 💳 **Payment Integration** - WeChat Pay support with admin confirmation workflow
- 📧 **Contact System** - Built-in inquiry management with admin reply functionality
- 🔗 **Registration Tracking** - Magic link system for users to check their registration status
- 🌐 **Bilingual Support** - Full English and Chinese language support

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, next-intl
- **Backend**: FastAPI, SQLAlchemy (async), PostgreSQL
- **Testing**: Pytest (backend), Vitest + React Testing Library (frontend)

## Getting Started

### Prerequisites

- Python 3.12+ with [uv](https://github.com/astral-sh/uv) package manager
- Node.js 18+
- PostgreSQL 15+

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/enjoyyoga.git
cd enjoyyoga
```

2. **Backend setup**
```bash
cd backend
uv sync
cp .env.example .env  # Configure your database URL
uv run alembic upgrade head
uv run python setup_admin.py
```

3. **Frontend setup**
```bash
cd frontend
npm install
```

4. **Start development servers**

In one terminal:
```bash
cd backend && uv run uvicorn app.main:app --reload
```

In another terminal:
```bash
cd frontend && npm run dev
```

Visit http://localhost:3000 to see the application.

## Project Structure

```
enjoyyoga/
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── models/    # Database models
│   │   ├── routers/   # API endpoints
│   │   ├── schemas/   # Pydantic validation
│   │   └── services/  # Business logic
│   ├── alembic/       # Database migrations
│   └── tests/         # Backend unit tests
│
└── frontend/          # Next.js frontend
    ├── src/
    │   ├── app/       # Next.js App Router pages
    │   ├── components/# React components
    │   ├── lib/       # API clients and utilities
    │   └── messages/  # i18n translations (en/zh)
    └── __tests__/     # Frontend unit tests
```

## Testing

### Backend Tests
```bash
cd backend
uv run pytest                    # Run all tests
uv run pytest --cov=app          # Run with coverage
```

**128 unit tests** covering services, authentication, and API endpoints.

### Frontend Tests
```bash
cd frontend
npm run test                     # Run all tests
npm run test:coverage            # Run with coverage
```

**80 unit tests** covering API clients, components, and user interactions.

## API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Key Features

### Registration System
- Capacity management with waitlist support
- Free and paid class support
- Email confirmations with tracking links
- Consent form requirement for specific yoga types

### Payment Workflow
1. User registers for paid class
2. Payment page with WeChat Pay QR code displayed
3. User uploads payment screenshot
4. Admin confirms payment and updates registration status
5. User receives confirmation email

### Contact Inquiry System
- Floating contact widget on all pages
- Categorized inquiries (Scheduling, General, Business)
- Admin dashboard for inquiry management
- Direct reply functionality with email delivery

### Tracking System
- Magic link sent with all registration emails
- View all registrations and payment status
- Email recovery for lost tracking links
- No account registration required

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or support, please open an issue in the GitHub repository or contact us through the application's contact form.
