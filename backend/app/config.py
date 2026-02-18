from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/enjoyyoga"
    cors_origins: list[str] = ["http://localhost:3000"]

    # Server URL for absolute image URLs
    server_url: str = "http://localhost:8000"

    # JWT settings
    jwt_secret_key: str = "your-secret-key-here"  # Change in production
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 1440  # 24 hours

    # SMTP settings for email notifications
    smtp_host: str = "smtp.gmail.com"  # Default to Gmail
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "enjoyyoga"
    smtp_use_tls: bool = True

    # Frontend URL for tracking links
    frontend_url: str = "http://localhost:3000"

    # Upload directory settings
    upload_dir: str = "uploads"

    model_config = {"env_file": ".env"}


settings = Settings()
