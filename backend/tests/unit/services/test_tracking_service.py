"""Unit tests for tracking service."""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tracking_token import TrackingToken
from app.services.tracking_service import TrackingService


class TestTrackingService:
    """Test cases for TrackingService."""

    @pytest.mark.unit
    async def test_get_or_create_token_creates_new(self, db_session: AsyncSession):
        """Test creating a new tracking token for a new email."""
        service = TrackingService()
        token = await service.get_or_create_token("new@example.com", db_session)

        assert token.email == "new@example.com"
        assert len(token.token) == 64  # secrets.token_hex(32) produces 64 chars
        assert token.id is not None

    @pytest.mark.unit
    async def test_get_or_create_token_returns_existing(self, db_session: AsyncSession):
        """Test that the same token is returned for the same email."""
        service = TrackingService()
        first = await service.get_or_create_token("repeat@example.com", db_session)
        second = await service.get_or_create_token("repeat@example.com", db_session)

        assert first.id == second.id
        assert first.token == second.token

    @pytest.mark.unit
    async def test_get_or_create_token_normalizes_email_lowercase(
        self, db_session: AsyncSession
    ):
        """Test that email is normalized to lowercase."""
        service = TrackingService()
        token = await service.get_or_create_token("Test@EXAMPLE.COM", db_session)
        assert token.email == "test@example.com"

    @pytest.mark.unit
    async def test_get_or_create_token_normalizes_email_strip(
        self, db_session: AsyncSession
    ):
        """Test that email is stripped of whitespace."""
        service = TrackingService()
        token = await service.get_or_create_token("  user@example.com  ", db_session)
        assert token.email == "user@example.com"

    @pytest.mark.unit
    async def test_get_or_create_token_normalized_matches_original(
        self, db_session: AsyncSession
    ):
        """Test that differently-cased emails resolve to the same token."""
        service = TrackingService()
        first = await service.get_or_create_token("User@Example.com", db_session)
        second = await service.get_or_create_token("user@example.com", db_session)

        assert first.id == second.id

    @pytest.mark.unit
    async def test_get_or_create_token_different_emails(self, db_session: AsyncSession):
        """Test that different emails get different tokens."""
        service = TrackingService()
        token_a = await service.get_or_create_token("a@example.com", db_session)
        token_b = await service.get_or_create_token("b@example.com", db_session)

        assert token_a.id != token_b.id
        assert token_a.token != token_b.token

    @pytest.mark.unit
    async def test_get_email_by_token_valid(self, db_session: AsyncSession):
        """Test looking up email by a valid token."""
        service = TrackingService()
        created = await service.get_or_create_token("lookup@example.com", db_session)

        email = await service.get_email_by_token(created.token, db_session)
        assert email == "lookup@example.com"

    @pytest.mark.unit
    async def test_get_email_by_token_invalid(self, db_session: AsyncSession):
        """Test that an invalid token returns None."""
        service = TrackingService()
        email = await service.get_email_by_token("nonexistent_token_string", db_session)
        assert email is None

    @pytest.mark.unit
    async def test_get_email_by_token_empty_string(self, db_session: AsyncSession):
        """Test that an empty string token returns None."""
        service = TrackingService()
        email = await service.get_email_by_token("", db_session)
        assert email is None

    @pytest.mark.unit
    def test_build_tracking_url_default_locale(self, mock_settings):
        """Test building tracking URL with default locale."""
        service = TrackingService()
        url = service.build_tracking_url("abc123", "en")
        assert url == "http://localhost:3000/en/track/abc123"

    @pytest.mark.unit
    def test_build_tracking_url_zh_locale(self, mock_settings):
        """Test building tracking URL with Chinese locale."""
        service = TrackingService()
        url = service.build_tracking_url("abc123", "zh")
        assert url == "http://localhost:3000/zh/track/abc123"

    @pytest.mark.unit
    def test_build_tracking_url_custom_frontend(self, mocker):
        """Test building tracking URL with custom frontend_url."""
        from app.config import settings
        original = settings.frontend_url
        settings.frontend_url = "https://enjoyyoga.com"

        try:
            service = TrackingService()
            url = service.build_tracking_url("token123", "en")
            assert url == "https://enjoyyoga.com/en/track/token123"
        finally:
            settings.frontend_url = original

    @pytest.mark.unit
    async def test_token_is_64_hex_chars(self, db_session: AsyncSession):
        """Test that generated tokens are valid 64-char hex strings."""
        service = TrackingService()
        token = await service.get_or_create_token("hex@example.com", db_session)

        assert len(token.token) == 64
        # Verify it's a valid hex string
        int(token.token, 16)
