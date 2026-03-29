import enum
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing_extensions import Literal


class CoreSettings(BaseSettings):
    app_name: str = "Weather Brief"
    app_version: str = "1.0"
    debug: bool = False

    app_host: str = "0.0.0.0"
    app_port: int = 8000
    app_reload: bool = True
    app_module: str = "app.main:app"

    allowed_origins: list[str] = Field(
        default=[
            "http://localhost:8000",
            "http://127.0.0.1:8000",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    )
    allow_credentials: bool = True
    allow_methods: list[str] = ["*"]
    allow_headers: list[str] = ["*"]

    title: str = "Weather Brief"
    description: str = "Weather Brief API"
    version: str = "1.0"
    docs_url: str = "/docs"

    algorithm: str = "HS256"
    secret_key: str = Field(..., validation_alias="SECRET_KEY")
    session_secret_key: str = Field(..., validation_alias="SESSION_SECRET_KEY")
    fernet_encryption_key: bytes = Field(..., validation_alias="FERNET_ENCRYPTION_KEY")
    hash_algorithm: str = "argon2"
    hash_rounds: int = 12

    base_dir: Path = Path(__file__).parent.parent.parent

    http_timeout: float = 10.0
    default_lang: str = "ru"
    default_units: str = "metric"

    google_client_id: str = Field(..., validation_alias="GOOGLE_CLIENT_ID")
    google_client_secret: str = Field(..., validation_alias="GOOGLE_CLIENT_SECRET")
    github_client_id: str = Field(..., validation_alias="GITHUB_CLIENT_ID")
    github_client_secret: str = Field(..., validation_alias="GITHUB_CLIENT_SECRET")

    frontend_oauth_callback_url: str = Field(
        default="http://localhost:3000/auth/oauth/callback",
        validation_alias="FRONTEND_OAUTH_CALLBACK_URL",
    )

    token_minutes_length: int = 30
    token_days_length: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    access_denied_message: str = "Access denied"
    key_error_message: str = "Key not found"
    user_error_message: str = "User not found"
    local_error_message: str = "Local not found"
    provider_error_message: str = "AuthProvider not found"
    auth_credentials_error_message: str = "Invalid credentials"
    token_error_message: str = "Invalid refresh token"

    max_attempts: int = 10
    short_token_hex: int = 3
    long_token_hex: int = 5

    session_cookie_domain: str | None = None
    session_cookie_secure: bool = False
    session_cookie_httponly: bool = True
    session_cookie_samesite: Literal["lax", "strict", "none"] = "lax"

    session_cookie_name: str = "session"
    session_cookie_path: str = "/"
    session_max_age: int = 3600

    refresh_token_cookie_name: str = "refresh_token"
    refresh_token_cookie_path: str = "/"
    refresh_token_cookie_max_age: int = 3600 * 24 * 30

    log_level: str = "INFO"
    log_dir: Path = Path(__file__).parent.parent.parent / "logs"
    log_file: str = "app.log"
    log_max_bytes: int = 10 * 1024 * 1024
    log_backup_count: int = 3

    default_limits_request: list = ["60/minute"]
    very_strong_limit_request: str = "1/minute"
    strong_limit_request: str = "5/minute"
    average_limit_request: str = "15/minute"
    light_limit_request: str = "30/minute"


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class Provider(str, enum.Enum):
    EMAIL = "email"
    GOOGLE = "google"
    GITHUB = "github"


class ApiService(str, enum.Enum):
    OPENWEATHER = "openweather"


class Metric(str, enum.Enum):
    METRIC = "metric"
    IMPERIAL = "imperial"
    KELVIN = "kelvin"


core_settings = CoreSettings()
