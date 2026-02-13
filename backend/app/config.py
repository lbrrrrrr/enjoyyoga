from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/enjoyyoga"
    cors_origins: list[str] = ["http://localhost:3000"]

    # JWT settings
    jwt_secret_key: str = "your-secret-key-here"  # Change in production
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 1440  # 24 hours

    model_config = {"env_file": ".env"}


settings = Settings()
