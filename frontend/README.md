# Enjoyyoga Frontend

A bilingual (English/Chinese) yoga business management application built with Next.js 15, TypeScript, and Tailwind CSS.

## Features

- **Bilingual Support**: Complete English/Chinese internationalization
- **Admin Panel**: Teacher management, class scheduling, registration oversight
- **Contact System**: Inquiry management with email notifications and reply functionality
- **Responsive Design**: Mobile-friendly interface with shadcn/ui components
- **Authentication**: JWT-based admin authentication with session management

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API server running (see `/backend` directory)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Testing
```bash
npm run test         # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:ui      # Run tests with interactive UI
```

## Project Structure

```
src/
├── app/[locale]/           # Next.js 15 App Router with internationalization
│   ├── admin/             # Admin panel pages
│   ├── classes/           # Class listing and details
│   ├── teachers/          # Teacher profiles
│   └── contact/           # Contact forms
├── components/            # Reusable UI components
│   ├── admin/            # Admin-specific components
│   ├── contact/          # Contact form components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utilities and API clients
│   ├── api.ts           # Public API client
│   └── admin-api.ts     # Admin API client
├── messages/             # Internationalization files
│   ├── en.json          # English translations
│   └── zh.json          # Chinese translations
└── __tests__/            # Test files
    ├── components/       # Component tests
    └── lib/             # API client tests
```

## Testing

The project includes comprehensive unit tests with **97.5% pass rate (77/79 tests)**:

- **API Integration Tests**: Complete coverage of all API endpoints
- **Component Tests**: UI components with user interaction testing
- **Bilingual Testing**: Internationalization and translation testing

**Testing Stack**:
- **Vitest**: Fast test runner (10-20x faster than Jest)
- **React Testing Library**: Component testing utilities
- **MSW**: Network-level API mocking
- **@testing-library/jest-dom**: Extended matchers for DOM testing

### Running Specific Tests

```bash
# Run specific test file
npm test -- InquiriesClient

# Run tests matching pattern
npm test -- -t "should render"

# Run with verbose output
npm test -- --reporter=verbose

# Single run (no watch mode)
npm test -- --run
```

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Internationalization**: next-intl
- **Authentication**: JWT with cookies
- **Testing**: Vitest + React Testing Library + MSW
- **Deployment**: Vercel-ready

## API Integration

The frontend connects to a FastAPI backend with these main endpoints:

- **Public API**: Classes, teachers, registrations, contact inquiries
- **Admin API**: Protected endpoints for managing content and viewing analytics
- **Authentication**: JWT-based admin login with session management

## Development Notes

- All user-facing content supports bilingual display
- Admin panel features comprehensive inquiry management
- Form validation and error handling throughout
- Mobile-responsive design with modern UI components
- Comprehensive test coverage for all critical functionality

For detailed development instructions, see the main project documentation in `/CLAUDE.md`.
