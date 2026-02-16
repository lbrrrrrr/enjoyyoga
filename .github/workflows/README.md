# GitHub Actions Workflows

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
