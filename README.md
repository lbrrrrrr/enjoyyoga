# enjoyyoga

A bilingual (English/Chinese) web application for a yoga business, featuring class listings, teacher profiles, yoga type descriptions, and a class registration system.

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

## Email Configuration (SMTP)

The application supports email notifications for class registrations. To configure email sending:

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
- Register for a class to trigger a confirmation email

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
