# GitHub Actions Workflows

This repository uses GitHub Actions for continuous integration and automated code review.

## Overview

- **Backend Tests** - Automated testing for FastAPI backend (155+ tests)
- **Frontend Tests** - Automated testing for Next.js frontend (80+ tests)
- **Claude PR Review** - AI-powered code review using Claude Sonnet 4.5

## Backend Tests

Runs automatically on every push to `main` and on all pull requests.

### What Gets Tested

- **155+ unit tests** covering:
  - Schedule parsing and validation logic
  - Registration management with capacity validation
  - Email notifications and template management
  - JWT authentication and password security
  - Admin API endpoints and payment integration
  - Business logic, error handling, and edge cases

### Features

- ✅ **Fast execution** with dependency caching (~30-60 seconds)
- ✅ **Coverage reports** (HTML + JSON) with branch coverage
- ✅ **Detailed test results** in GitHub Actions UI
- ✅ **Downloadable artifacts** (test logs, coverage reports)
- ✅ **Automatic failure detection** with clear error messages

### Artifacts

Available for 90 days after each run:
- `backend-test-results/junit.xml` - JUnit XML for GitHub UI
- `backend-test-results/report.json` - Detailed test execution data
- `backend-test-results/coverage-html/` - Browsable coverage report
- `backend-test-results/coverage.json` - Coverage data in JSON

### Running Locally

```bash
cd backend
uv run pytest -v --cov=app --cov-report=html
# Open coverage-html/index.html in browser
```

## Frontend Tests

Runs automatically on every push to `main` and on all pull requests.

### What Gets Tested

- **80+ unit tests** covering:
  - Public API client (classes, teachers, registrations, contact, payments)
  - Admin API client with JWT authentication (payments, settings, packages)
  - React components (InquiriesClient, forms, contact widgets)
  - Bilingual internationalization (English/Chinese)
  - Error handling scenarios (401, 404, 500 responses)

### Features

- ✅ **Fast execution** with npm caching (~20-40 seconds)
- ✅ **Coverage reports** using Vitest coverage
- ✅ **Modern test stack** (Vitest + React Testing Library + MSW)
- ✅ **Detailed test results** in GitHub Actions UI
- ✅ **Downloadable artifacts** (test logs, coverage reports)

### Artifacts

Available for 90 days after each run:
- `frontend-test-results/junit.xml` - JUnit XML for GitHub UI
- `frontend-test-results/results.json` - Detailed test execution data
- `frontend-test-results/coverage/` - Browsable coverage report

### Running Locally

```bash
cd frontend
npm test -- --run --coverage
# Open coverage/index.html in browser
```

## Claude PR Review

Automated code review using Claude AI for all pull requests.

### Setup

1. **Get Claude API Key**:
   - Go to [https://console.anthropic.com](https://console.anthropic.com)
   - Sign up or log in
   - Navigate to API Keys section
   - Create a new API key

2. **Add API Key to GitHub**:
   - Go to your repository on GitHub
   - Navigate to **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `ANTHROPIC_API_KEY`
   - Value: Your Claude API key
   - Click **Add secret**

3. **Test the Workflow**:
   - Create a new branch and make some changes
   - Open a pull request
   - The workflow will automatically trigger and post a review comment

### Features

- ✅ **Automatic Reviews**: Triggers on PR open, update, and reopen
- ✅ **Comprehensive Analysis**: Checks for bugs, security issues, code quality
- ✅ **Context-Aware**: Understands the enjoyyoga project structure
- ✅ **Size Limits**: Handles large PRs gracefully (>100KB diffs)
- ✅ **Uses Claude Sonnet 4.5**: Latest and most capable model

### What Gets Reviewed

The workflow reviews for:
- **Security vulnerabilities** (SQL injection, XSS, authentication issues)
- **Bugs and logic errors**
- **Code quality and best practices**
- **Performance concerns**
- **Consistency with existing patterns**
- **Both backend (FastAPI) and frontend (Next.js) code**

### Customization

Edit `.github/workflows/claude-pr-review.yml` to:
- Change the trigger conditions
- Modify the review prompt
- Adjust size limits
- Use different Claude models (opus, sonnet, haiku)

### Cost Considerations

- Claude API pricing: ~$3 per million input tokens, ~$15 per million output tokens
- Average PR review: ~$0.05-0.20 per review
- Large PRs (100KB+) are skipped to control costs

### Troubleshooting

**Review not posting?**
- Check that `ANTHROPIC_API_KEY` secret is set correctly
- Verify the workflow has `pull-requests: write` permission
- Check Actions tab for error logs

**API rate limits?**
- Anthropic has generous rate limits for standard tier
- Consider upgrading API tier if needed

**Reviews too verbose/brief?**
- Edit the prompt in the workflow file
- Adjust `max_tokens` (currently 4096)

## CI Workflow Integration

The three workflows work together to provide comprehensive CI:

1. **Backend Tests** - Verify all business logic and API endpoints
2. **Frontend Tests** - Verify UI components and API integration
3. **Claude PR Review** - Check code quality, security, and best practices

**Status Checks**: All three workflows must pass before a PR can be merged (configure this in branch protection rules).

**Performance**:
- Total CI time: ~1-2 minutes with caching
- Parallel execution: Backend and frontend tests run simultaneously
- Artifact retention: 90 days for test results and coverage reports

## Troubleshooting CI Workflows

### Tests Failing in CI but Passing Locally

1. Check for environment differences (Node/Python versions)
2. Verify all dependencies are locked (package-lock.json, uv.lock)
3. Look for timezone or locale-specific test failures
4. Check GitHub Actions logs for detailed error messages

### Slow CI Execution

1. Verify caching is working (check "Restore cached dependencies" step)
2. Check if cache keys need updating after dependency changes
3. Review test execution time in artifacts (JSON reports)

### Missing Artifacts

1. Ensure tests are creating output files in correct directories
2. Check artifact upload paths in workflow files
3. Verify `if: always()` condition is present for upload steps

### Permission Errors

1. Verify `GITHUB_TOKEN` has necessary permissions
2. Check workflow permissions in repository settings
3. Ensure `dorny/test-reporter` has `checks: write` permission
