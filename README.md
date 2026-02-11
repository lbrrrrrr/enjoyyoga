# enjoyyoga

A bilingual (English/Chinese) web application for a yoga business, featuring class listings, teacher profiles, yoga type descriptions, and a class registration system.

## Tech Stack

- **Frontend**: Next.js 15 (TypeScript), shadcn/ui, Tailwind CSS, next-intl
- **Backend**: FastAPI, SQLAlchemy (async), asyncpg
- **Database**: PostgreSQL

## Getting Started

### Backend

```bash
cd backend
uv sync
cp .env.example .env  # Edit with your database credentials
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

API docs available at http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:3000
