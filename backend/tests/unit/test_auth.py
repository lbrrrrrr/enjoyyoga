"""Unit tests for authentication module."""
import hashlib
from datetime import datetime, timedelta
from unittest.mock import patch

import pytest
from fastapi import HTTPException
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import (
    authenticate_admin,
    create_access_token,
    get_current_admin_bearer,
    get_password_hash,
    verify_password,
)
from app.config import settings
from app.models.admin_user import AdminUser


class TestAuthFunctions:
    """Test cases for authentication functions."""

    @pytest.mark.unit
    def test_get_password_hash(self):
        """Test password hashing function."""
        password = "test_password_123"
        hashed = get_password_hash(password)

        # Should return SHA256 hash (current implementation)
        expected = hashlib.sha256(password.encode()).hexdigest()
        assert hashed == expected

    @pytest.mark.unit
    def test_get_password_hash_different_inputs(self):
        """Test that different passwords produce different hashes."""
        password1 = "password123"
        password2 = "password456"

        hash1 = get_password_hash(password1)
        hash2 = get_password_hash(password2)

        assert hash1 != hash2

    @pytest.mark.unit
    def test_get_password_hash_empty_string(self):
        """Test hashing empty string."""
        hashed = get_password_hash("")
        expected = hashlib.sha256("".encode()).hexdigest()
        assert hashed == expected

    @pytest.mark.unit
    def test_verify_password_correct(self):
        """Test password verification with correct password."""
        password = "test_password_123"
        hashed = get_password_hash(password)

        assert verify_password(password, hashed) is True

    @pytest.mark.unit
    def test_verify_password_incorrect(self):
        """Test password verification with incorrect password."""
        password = "test_password_123"
        wrong_password = "wrong_password"
        hashed = get_password_hash(password)

        assert verify_password(wrong_password, hashed) is False

    @pytest.mark.unit
    def test_verify_password_empty_strings(self):
        """Test password verification with empty strings."""
        hashed = get_password_hash("")
        assert verify_password("", hashed) is True
        assert verify_password("not_empty", hashed) is False

    @pytest.mark.unit
    def test_create_access_token_default_expiry(self):
        """Test JWT token creation with default expiry."""
        data = {"sub": "testuser"}
        token = create_access_token(data)

        # Decode token to verify contents
        decoded = jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])

        assert decoded["sub"] == "testuser"
        assert "exp" in decoded

        # Verify expiry is approximately 24 hours from now
        exp_timestamp = decoded["exp"]
        exp_datetime = datetime.utcfromtimestamp(exp_timestamp)
        now = datetime.utcnow()
        time_diff = exp_datetime - now

        # Should be close to 24 hours (within 1 minute tolerance)
        expected_hours = 24
        assert abs(time_diff.total_seconds() - (expected_hours * 3600)) < 60

    @pytest.mark.unit
    def test_create_access_token_custom_expiry(self):
        """Test JWT token creation with custom expiry."""
        data = {"sub": "testuser"}
        custom_delta = timedelta(hours=2)
        token = create_access_token(data, expires_delta=custom_delta)

        decoded = jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])

        exp_timestamp = decoded["exp"]
        exp_datetime = datetime.utcfromtimestamp(exp_timestamp)
        now = datetime.utcnow()
        time_diff = exp_datetime - now

        # Should be close to 2 hours (within 1 minute tolerance)
        assert abs(time_diff.total_seconds() - (2 * 3600)) < 60

    @pytest.mark.unit
    def test_create_access_token_additional_claims(self):
        """Test JWT token creation with additional claims."""
        data = {"sub": "testuser", "role": "admin", "permissions": ["read", "write"]}
        token = create_access_token(data)

        decoded = jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])

        assert decoded["sub"] == "testuser"
        assert decoded["role"] == "admin"
        assert decoded["permissions"] == ["read", "write"]

    @pytest.mark.unit
    async def test_authenticate_admin_success(
        self,
        db_session: AsyncSession,
        admin_user_in_db: AdminUser,
    ):
        """Test successful admin authentication."""
        # Update admin user with known password
        password = "test_password"
        admin_user_in_db.hashed_password = get_password_hash(password)
        admin_user_in_db.is_active = True
        await db_session.commit()

        result = await authenticate_admin(
            db_session, admin_user_in_db.username, password
        )

        assert result is not None
        assert result.username == admin_user_in_db.username
        assert result.id == admin_user_in_db.id

    @pytest.mark.unit
    async def test_authenticate_admin_wrong_password(
        self,
        db_session: AsyncSession,
        admin_user_in_db: AdminUser,
    ):
        """Test admin authentication with wrong password."""
        password = "correct_password"
        wrong_password = "wrong_password"
        admin_user_in_db.hashed_password = get_password_hash(password)
        admin_user_in_db.is_active = True
        await db_session.commit()

        result = await authenticate_admin(
            db_session, admin_user_in_db.username, wrong_password
        )

        assert result is None

    @pytest.mark.unit
    async def test_authenticate_admin_user_not_found(self, db_session: AsyncSession):
        """Test admin authentication with non-existent user."""
        result = await authenticate_admin(
            db_session, "nonexistent_user", "any_password"
        )

        assert result is None

    @pytest.mark.unit
    async def test_authenticate_admin_inactive_user(
        self,
        db_session: AsyncSession,
        admin_user_in_db: AdminUser,
    ):
        """Test admin authentication with inactive user."""
        password = "test_password"
        admin_user_in_db.hashed_password = get_password_hash(password)
        admin_user_in_db.is_active = False  # Inactive user
        await db_session.commit()

        result = await authenticate_admin(
            db_session, admin_user_in_db.username, password
        )

        assert result is None

    @pytest.mark.unit
    async def test_get_current_admin_bearer_success(
        self,
        db_session: AsyncSession,
        admin_user_in_db: AdminUser,
    ):
        """Test successful current admin retrieval."""
        # Create valid token
        token_data = {"sub": str(admin_user_in_db.id)}
        token = create_access_token(token_data)

        result = await get_current_admin_bearer(token, db_session)

        assert result is not None
        assert result.username == admin_user_in_db.username
        assert result.id == admin_user_in_db.id

    @pytest.mark.unit
    async def test_get_current_admin_bearer_invalid_token_format(self, db_session: AsyncSession):
        """Test current admin retrieval with invalid token format."""
        invalid_token = "invalid.token.format"

        with pytest.raises(HTTPException) as exc_info:
            await get_current_admin_bearer(invalid_token, db_session)

        assert exc_info.value.status_code == 401
        assert "Could not validate credentials" in str(exc_info.value.detail)

    @pytest.mark.unit
    async def test_get_current_admin_bearer_expired_token(self, db_session: AsyncSession):
        """Test current admin retrieval with expired token."""
        # Create expired token
        token_data = {"sub": "testuser"}
        expired_delta = timedelta(seconds=-1)  # Already expired
        expired_token = create_access_token(token_data, expired_delta)

        with pytest.raises(HTTPException) as exc_info:
            await get_current_admin_bearer(expired_token, db_session)

        assert exc_info.value.status_code == 401

    @pytest.mark.unit
    async def test_get_current_admin_bearer_user_not_found(self, db_session: AsyncSession):
        """Test current admin retrieval when user doesn't exist in database."""
        # Create token for non-existent user
        token_data = {"sub": "nonexistent_user"}
        token = create_access_token(token_data)

        with pytest.raises(HTTPException) as exc_info:
            await get_current_admin_bearer(token, db_session)

        assert exc_info.value.status_code == 401
        assert "Could not validate credentials" in str(exc_info.value.detail)

    @pytest.mark.unit
    async def test_get_current_admin_bearer_inactive_user(
        self,
        db_session: AsyncSession,
        admin_user_in_db: AdminUser,
    ):
        """Test current admin retrieval with inactive user."""
        # Make user inactive
        admin_user_in_db.is_active = False
        await db_session.commit()

        # Create valid token
        token_data = {"sub": str(admin_user_in_db.id)}
        token = create_access_token(token_data)

        with pytest.raises(HTTPException) as exc_info:
            await get_current_admin_bearer(token, db_session)

        assert exc_info.value.status_code == 401
        assert "Could not validate credentials" in str(exc_info.value.detail)

    @pytest.mark.unit
    async def test_get_current_admin_bearer_no_username_in_token(self, db_session: AsyncSession):
        """Test current admin retrieval when token has no username."""
        # Create token without 'sub' claim
        token_data = {"role": "admin"}
        token = create_access_token(token_data)

        with pytest.raises(HTTPException) as exc_info:
            await get_current_admin_bearer(token, db_session)

        assert exc_info.value.status_code == 401
        assert "Could not validate credentials" in str(exc_info.value.detail)

    @pytest.mark.unit
    def test_create_access_token_with_wrong_secret(self):
        """Test that token created with wrong secret cannot be decoded."""
        data = {"sub": "testuser"}
        token = create_access_token(data)

        # Try to decode with wrong secret
        with pytest.raises(Exception):
            jwt.decode(token, "wrong_secret", algorithms=["HS256"])

    @pytest.mark.unit
    def test_password_hash_consistency(self):
        """Test that the same password always produces the same hash."""
        password = "consistent_password_123"

        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        assert hash1 == hash2

    @pytest.mark.unit
    def test_verify_password_case_sensitivity(self):
        """Test that password verification is case sensitive."""
        password = "CaseSensitive123"
        wrong_case = "casesensitive123"
        hashed = get_password_hash(password)

        assert verify_password(password, hashed) is True
        assert verify_password(wrong_case, hashed) is False

    @pytest.mark.unit
    def test_unicode_password_handling(self):
        """Test handling of Unicode characters in passwords."""
        unicode_password = "пароль123密码"
        hashed = get_password_hash(unicode_password)

        assert verify_password(unicode_password, hashed) is True
        assert verify_password("password123", hashed) is False

    @pytest.mark.unit
    async def test_authenticate_admin_case_sensitive_username(
        self,
        db_session: AsyncSession,
        admin_user_in_db: AdminUser,
    ):
        """Test that username authentication is case sensitive."""
        password = "test_password"
        admin_user_in_db.hashed_password = get_password_hash(password)
        admin_user_in_db.is_active = True
        await db_session.commit()

        # Correct case
        result1 = await authenticate_admin(
            db_session, admin_user_in_db.username, password
        )
        assert result1 is not None

        # Wrong case
        result2 = await authenticate_admin(
            db_session, admin_user_in_db.username.upper(), password
        )
        assert result2 is None

    @pytest.mark.unit
    def test_token_algorithm_security(self):
        """Test that only HS256 algorithm is accepted."""
        data = {"sub": "testuser"}
        # settings already imported at top of file

        # Create token with HS256
        token = jwt.encode(data, settings.jwt_secret_key, algorithm="HS256")
        decoded = jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])
        assert decoded["sub"] == "testuser"

        # Try to decode with wrong algorithm should fail
        with pytest.raises(Exception):
            jwt.decode(token, settings.jwt_secret_key, algorithms=["RS256"])

    @pytest.mark.unit
    def test_token_exp_claim_format(self):
        """Test that token expiration claim is in correct format."""
        data = {"sub": "testuser"}
        token = create_access_token(data)

        decoded = jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])

        # exp should be a number (Unix timestamp)
        assert isinstance(decoded["exp"], (int, float))
        assert decoded["exp"] > 0

        # Should be in the future
        now_timestamp = datetime.utcnow().timestamp()
        assert decoded["exp"] > now_timestamp