# Backend Unit Tests

This directory contains comprehensive unit tests for the enjoyyoga backend business logic.

## Overview

The test suite covers all critical business logic in the backend application:

### ✅ Covered Components

#### Service Layer (High Priority - Critical Business Logic)
- **ScheduleParserService** (`test_schedule_parser.py`)
  - Schedule string parsing with regex patterns
  - Date/time validation against recurring patterns
  - Timezone handling and edge cases
  - 40+ test cases covering all parsing scenarios

- **RegistrationService** (`test_registration_service.py`)
  - Schedule-aware registration creation
  - Capacity validation and calculation
  - Schedule data management
  - Error handling for invalid dates/classes
  - 25+ test cases covering registration flow

- **NotificationService** (`test_notification_service.py`)
  - Email sending with SMTP fallback to console
  - Template variable substitution
  - Bilingual content selection (EN/ZH)
  - Database template retrieval
  - 20+ test cases covering notification scenarios

#### Authentication & Security (`test_auth.py`)
- Password verification and hashing (SHA256 - note: weak implementation)
- JWT token creation and validation
- Admin authentication flow
- Token expiration handling
- 25+ test cases covering security scenarios

#### Router Business Logic
- **Admin Router** (`test_admin.py`)
  - Protected route authentication
  - Dashboard statistics aggregation
  - Registration status updates
  - User management
  - 15+ test cases covering admin operations

- **Registrations Router** (`test_registrations.py`)
  - Registration creation with validation
  - Schedule-aware registration
  - Capacity checking
  - Available dates calculation
  - 20+ test cases covering registration endpoints

### Test Infrastructure

#### Fixtures (`conftest.py`)
- **Database**: In-memory SQLite for fast test execution
- **HTTP Client**: FastAPI test client with dependency overrides
- **Sample Data**: Complete fixtures for all model types
- **Authentication**: JWT token generation for protected routes
- **Mocking**: SMTP settings and external services

#### Coverage Scope
- **Unit Tests**: Focus on business logic isolation
- **Mocking**: External dependencies (SMTP, database connections)
- **Edge Cases**: Invalid inputs, error conditions, boundary values
- **Security**: Authentication, authorization, input validation

## Running Tests

### Install Dependencies
```bash
cd backend
uv sync  # Installs pytest and testing dependencies
```

### Run All Tests
```bash
# Run all unit tests
uv run pytest

# Run with verbose output
uv run pytest -v

# Run with coverage report
uv run pytest --cov=app --cov-report=html

# Run specific test file
uv run pytest tests/unit/services/test_schedule_parser.py

# Run specific test method
uv run pytest tests/unit/services/test_schedule_parser.py::TestScheduleParserService::test_parse_schedule_string_simple_recurring
```

### Test Markers
```bash
# Run only unit tests
uv run pytest -m unit

# Run integration tests (when added)
uv run pytest -m integration

# Run slow tests
uv run pytest -m slow
```

## Test Structure

```
tests/
├── conftest.py              # Common fixtures and test configuration
├── unit/
│   ├── services/
│   │   ├── test_schedule_parser.py       # Schedule parsing business logic
│   │   ├── test_registration_service.py  # Registration management logic
│   │   └── test_notification_service.py  # Email notification logic
│   ├── routers/
│   │   ├── test_admin.py                 # Admin endpoint logic
│   │   └── test_registrations.py         # Registration endpoint logic
│   └── test_auth.py                      # Authentication & security logic
└── fixtures/                             # Test data files (future use)
```

## Key Testing Patterns

### Database Testing
- Each test gets a fresh in-memory SQLite database
- Fixtures create sample data with proper relationships
- Transactions are rolled back after each test

### Async Testing
- Uses `pytest-asyncio` for async/await support
- Database operations are properly awaited
- HTTP client supports async endpoints

### Mocking External Services
- SMTP email sending falls back to console output
- Database connections use test-specific configuration
- JWT tokens use test secret keys

### Error Handling
- Tests verify proper error messages
- HTTP status codes are validated
- Exception types and details are checked

## Business Logic Coverage

### Critical Business Logic (100% Coverage Goal)
- ✅ Schedule parsing and validation
- ✅ Registration capacity management
- ✅ Email notifications with templates
- ✅ JWT authentication and authorization
- ✅ Admin operations and statistics

### Input Validation
- ✅ Email format validation
- ✅ Date/time format validation
- ✅ Language preference validation
- ✅ UUID format validation
- ✅ Required field validation

### Edge Cases
- ✅ Invalid schedule formats
- ✅ Capacity overflow scenarios
- ✅ Expired JWT tokens
- ✅ Non-existent records
- ✅ Inactive user accounts

### Security Testing
- ✅ Password verification
- ✅ JWT token validation
- ✅ Protected route access
- ✅ Input sanitization
- ✅ Authentication bypass attempts

## Notes for Developers

### Adding New Tests
1. Follow the naming convention: `test_*.py`
2. Use appropriate markers: `@pytest.mark.unit`
3. Create fixtures for reusable test data
4. Mock external dependencies
5. Test both success and failure scenarios

### Test Data Management
- Use fixtures from `conftest.py` for common data
- Create specific data in test methods for unique scenarios
- Ensure tests are isolated and don't depend on each other

### Performance Considerations
- In-memory SQLite for speed
- Minimal database operations per test
- Parallel test execution supported
- Background tasks are mocked

### Security Considerations
- Never use production credentials in tests
- Mock external services completely
- Test authentication and authorization thoroughly
- Validate input sanitization

## TODO: Future Enhancements

1. **Integration Tests**: Add tests for full API workflows
2. **Performance Tests**: Add tests for capacity and load scenarios
3. **Contract Tests**: Add API contract validation
4. **Coverage Reports**: Set up automated coverage reporting
5. **Continuous Integration**: GitHub Actions for automated testing

## Known Issues

1. **Password Hashing**: Current implementation uses SHA256 (weak) - should upgrade to bcrypt/Argon2
2. **NotificationService**: Has duplicate method definition that should be cleaned up
3. **Test Coverage**: Some edge cases in complex schedule parsing may need additional tests