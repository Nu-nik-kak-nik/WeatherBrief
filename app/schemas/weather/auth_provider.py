from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.core.core_settings import Provider


class AuthProviderBase(BaseModel):
    user_id: str
    provider: Provider
    provider_id: str
    provider_email: str | None = None
    provider_username: str | None = None
    profile_data: dict | None = None
    access_token: str | None = None
    refresh_token: str | None = None
    token_expires_at: datetime | None = None


class AuthProviderCreate(AuthProviderBase):
    pass


class AuthProviderUpdate(BaseModel):
    provider_email: str | None = None
    provider_username: str | None = None
    profile_data: dict | None = None
    access_token: str | None = None
    refresh_token: str | None = None
    token_expires_at: datetime | None = None
    unlinked_at: datetime | None = None


class AuthProviderUpdateUser(BaseModel):
    provider_username: str | None = None
    profile_data: dict | None = None

    model_config = ConfigDict(extra="forbid")


class AuthProviderOut(BaseModel):
    id: int
    user_id: str
    provider: Provider
    provider_id: str
    provider_email: str | None
    provider_username: str | None
    profile_data: dict | None
    token_expires_at: datetime | None
    linked_at: datetime
    unlinked_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class UserOAuthInfo(BaseModel):
    email: str | None = None
    username: str | None = None
    provider_id: str
    provider: Provider
    avatar_url: str | None = None
    access_token: str | None = None
    refresh_token: str | None = None
    token_expires_at: int | None = None

    model_config = ConfigDict(extra="ignore")

    @property
    def provider_email(self) -> str | None:
        return self.email

    @property
    def provider_username(self) -> str | None:
        return self.username


class UpdateOAuth(BaseModel):
    user_id: str
    provider: Provider
    access_token: str | None = None
    refresh_token: str | None = None
    token_expires_at: int | None = None

    model_config = ConfigDict(extra="ignore")


class UpdateOAuthTokens(BaseModel):
    access_token: str | None = None
    refresh_token: str | None = None
    token_expires_at: int | None = None

    model_config = ConfigDict(extra="ignore")


class AuthProviderCreateEncrypted(BaseModel):
    user_id: str
    provider: Provider
    provider_id: str
    provider_email: str | None = None
    provider_username: str | None = None
    profile_data: dict | None = None
    access_token: bytes | None = None
    refresh_token: bytes | None = None
    token_expires_at: datetime | None = None


class AuthProviderUpdateEncrypted(BaseModel):
    provider_email: str | None = None
    provider_username: str | None = None
    profile_data: dict | None = None
    access_token: bytes | None = None
    refresh_token: bytes | None = None
    token_expires_at: datetime | None = None
    unlinked_at: datetime | None = None
