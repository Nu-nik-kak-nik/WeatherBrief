import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.core_settings import Metric, Provider, UserRole


class UserBase(BaseModel):
    email: EmailStr = Field(..., description="Email пользователя")
    username: str | None = Field(
        None, min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$"
    )

    @field_validator("username", mode="before")
    @classmethod
    def validate_username(cls, v: str | None) -> str | None:
        if v:
            v = v.strip()
            if len(v) < 3:
                raise ValueError("Username must be at least 3 characters")
            if not re.match(r"^[a-zA-Z0-9_-]+$", v):
                raise ValueError(
                    "Username can only contain letters, numbers, underscores and hyphens"
                )
        return v


class UserCreate(UserBase):
    hashed_password: str | None = Field(None, min_length=6)
    preferred_lang: str = Field(default="ru", max_length=10)
    default_units: Metric = Metric.METRIC
    is_verified: bool = False
    is_active: bool = True
    role: UserRole = UserRole.USER

    model_config = ConfigDict(extra="forbid")


class UserOAuthCreate(BaseModel):
    email: EmailStr
    username: str | None = Field(
        None, min_length=3, max_length=255, pattern=r"^[a-zA-Z0-9_-]+$"
    )
    preferred_lang: str = Field(default="ru", max_length=10)
    default_units: Metric = Metric.METRIC
    role: UserRole = UserRole.USER
    is_verified: bool = True

    model_config = ConfigDict(extra="allow")

    @field_validator("username", mode="before")
    @classmethod
    def validate_username(cls, v):
        if v:
            if len(v) < 3:
                raise ValueError("Username must be at least 3 characters")
            if not re.match(r"^[a-zA-Z0-9_-]+$", v):
                raise ValueError(
                    "Username can only contain letters, numbers and underscores"
                )
        return v


class UserOAuthCreate2(BaseModel):
    provider: Provider
    provider_id: str
    provider_email: str | None = None
    provider_username: str | None = None
    profile_data: dict | None = None
    access_token: str | None = None
    refresh_token: str | None = None
    token_expires_at: datetime | None = None

    model_config = ConfigDict(extra="forbid")


class UserOAuthInfo(BaseModel):
    email: str | None
    name: str | None
    provider_id: str
    provider: Provider
    avatar_url: str | None = None
    access_token: str | None = None
    refresh_token: str | None = None
    token_expires_at: int | None = None

    model_config = ConfigDict(extra="ignore")


class UserUpdate(BaseModel):
    username: str | None = Field(
        None, min_length=3, max_length=255, pattern=r"^[a-zA-Z0-9_-]+$"
    )
    email: EmailStr | None = Field(None)
    preferred_lang: str | None = Field(None, max_length=10)
    default_units: Metric | None = None
    is_verified: bool | None = None
    is_active: bool | None = None
    refresh_token: str | None = None

    @field_validator("username", mode="before")
    @classmethod
    def validate_username(cls, v):
        if v:
            if len(v) < 3:
                raise ValueError("Username must be at least 3 characters")
            if not re.match(r"^[a-zA-Z0-9_-]+$", v):
                raise ValueError(
                    "Username can only contain letters, numbers, underscores and hyphens"
                )
        return v


class UserOut(BaseModel):
    id: str
    email: EmailStr | None
    username: str | None
    role: UserRole
    is_active: bool
    is_verified: bool
    is_superuser: bool
    default_units: Metric
    preferred_lang: str
    refresh_token: str | None
    created_at: str
    last_login_at: str | None
    updated_at: str

    model_config = ConfigDict(from_attributes=True)


class UserProfile(BaseModel):
    id: str
    email: EmailStr | None
    username: str | None
    role: UserRole
    is_active: bool
    is_verified: bool
    is_superuser: bool
    default_units: Metric
    preferred_lang: str
    refresh_token: str | None = None
    created_at: datetime
    last_login_at: datetime | None
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserIsActive(BaseModel):
    id: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
