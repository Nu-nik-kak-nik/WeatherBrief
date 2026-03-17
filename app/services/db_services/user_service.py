import secrets
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.core_settings import Provider, core_settings
from app.core.exceptions import EntityNotFoundError
from app.db.repositories.auth_provider import AuthProviderRepository
from app.db.repositories.user import UserRepository
from app.models.weather import AuthProvider, User
from app.schemas.weather.auth_provider import (
    AuthProviderCreateEncrypted,
    AuthProviderUpdateEncrypted,
    UpdateOAuth,
    UserOAuthInfo,
)
from app.schemas.weather.user import UserCreate, UserUpdate
from app.services.utils.crypto import crypto_manager
from app.services.utils.security import hasher


class UserService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_repo = UserRepository(session)
        self.auth_provider_repo = AuthProviderRepository(session)

    async def register_user(self, user_data: UserCreate) -> User:
        return await self.user_repo.create(user_data)

    async def get_user_by_email(self, email: str) -> User | None:
        return await self.user_repo.get_by_email(email)

    async def get_user_by_id(
        self,
        user_id: str,
        providers: bool = False,
        locations: bool = False,
        keys: bool = False,
    ) -> User | None:
        return await self.user_repo.get_by_id(
            user_id, providers=providers, locations=locations, keys=keys
        )

    async def get_user_by_oauth_provider(
        self, provider: Provider, provider_id: str
    ) -> User | None:
        return await self.user_repo.get_by_oauth_provider(provider, provider_id)

    async def update_user(self, user_id: str, user_update: UserUpdate) -> User | None:
        return await self.user_repo.update(user_id, user_update)

    async def change_password(
        self, user_id: str, old_password: str, new_password: str
    ) -> User | None:
        is_valid = await self.user_repo.verify_password(user_id, old_password)
        if not is_valid:
            raise EntityNotFoundError("Current password is incorrect")

        hashed_new = hasher.hash_value(new_password)
        return await self.user_repo.update_password(user_id, hashed_new)

    async def authenticate_user(self, email: str, password: str) -> User | None:
        user = await self.get_user_by_email(email)
        if not user or not user.hashed_password:
            raise EntityNotFoundError("User not found")

        if not hasher.verify_value(password, user.hashed_password):
            raise EntityNotFoundError("Password is incorrect")

        await self.user_repo.update_last_login(user.id)
        return user

    async def activate_user(self, user_id: str) -> User | None:
        return await self.user_repo.activate_user(user_id)

    async def deactivate_user(self, user_id: str) -> User | None:
        return await self.user_repo.deactivate_user(user_id)

    async def update_refresh_token(
        self, user_id: str, refresh_token: str
    ) -> User | None:
        return await self.user_repo.update_refresh_token(user_id, refresh_token)

    @staticmethod
    def _sanitize_username(username: str | None) -> str | None:
        import re

        if not username:
            return None

        sanitized = re.sub(r"[^a-zA-Z0-9_-]", "_", username.strip())
        sanitized = sanitized.strip("_-")

        if not sanitized:
            return None

        if len(sanitized) < 3:
            sanitized = (
                f"{sanitized}_{secrets.token_hex(core_settings.short_token_hex)}"
            )

        return sanitized

    async def _ensure_unique_username(
        self, username: str, max_attempts: int = core_settings.max_attempts
    ) -> str:
        original = username
        for _ in range(max_attempts):
            existing = await self.user_repo.get_by_username(username)
            if not existing:
                return username
            username = f"{original}_{secrets.token_hex(core_settings.short_token_hex)}"

        return f"{original}_{secrets.token_hex(core_settings.long_token_hex)}"

    async def get_or_create_from_oauth(
        self,
        auth_info: UserOAuthInfo,
    ) -> tuple[User, bool]:
        existing_user = await self.get_user_by_oauth_provider(
            auth_info.provider, auth_info.provider_id
        )
        if existing_user:
            update_oauth = UpdateOAuth(
                user_id=existing_user.id,
                provider=auth_info.provider,
                access_token=auth_info.access_token,
                refresh_token=auth_info.refresh_token,
                token_expires_at=auth_info.token_expires_at,
            )
            await self._update_oauth_tokens(update_oauth)
            return existing_user, False

        user = None
        if auth_info.email:
            user = await self.get_user_by_email(auth_info.email)

        if user:
            await self._link_oauth_provider(user, auth_info)
            return user, False

        sanitized_username = self._sanitize_username(auth_info.username)

        if sanitized_username:
            sanitized_username = await self._ensure_unique_username(sanitized_username)

        else:
            sanitized_username = (
                f"user_{secrets.token_hex(core_settings.long_token_hex)}"
            )

        user_create = UserCreate(
            email=auth_info.email,
            username=sanitized_username,
            hashed_password=None,
            is_verified=True,
            is_active=True,
        )

        user = await self.user_repo.create(user_create)

        await self._create_oauth_provider(user, auth_info)

        await self.user_repo.update_last_login(user.id)

        return user, True

    async def _create_oauth_provider(
        self,
        user: User,
        auth_info: UserOAuthInfo,
    ) -> AuthProvider:
        token_expires_dt = None
        if auth_info.token_expires_at:
            token_expires_dt = datetime.fromtimestamp(
                auth_info.token_expires_at, tz=timezone.utc
            )

        encrypted_access = (
            crypto_manager.encrypt(auth_info.access_token)
            if auth_info.access_token
            else None
        )
        encrypted_refresh = (
            crypto_manager.encrypt(auth_info.refresh_token)
            if auth_info.refresh_token
            else None
        )

        auth_data = AuthProviderCreateEncrypted(
            user_id=user.id,
            provider=auth_info.provider,
            provider_id=auth_info.provider_id,
            provider_email=auth_info.provider_email,
            provider_username=auth_info.provider_username,
            profile_data={"avatar_url": auth_info.avatar_url}
            if auth_info.avatar_url
            else None,
            access_token=encrypted_access,
            refresh_token=encrypted_refresh,
            token_expires_at=token_expires_dt,
        )

        return await self.auth_provider_repo.create(auth_data)

    async def _link_oauth_provider(
        self,
        user: User,
        auth_info: UserOAuthInfo,
    ) -> None:
        existing = await self.auth_provider_repo.get_by_user_and_provider(
            user.id, auth_info.provider
        )

        if existing:
            update_oauth = UpdateOAuth(
                user_id=user.id,
                provider=auth_info.provider,
                access_token=auth_info.access_token,
                refresh_token=auth_info.refresh_token,
                token_expires_at=auth_info.token_expires_at,
            )
            await self._update_oauth_tokens(update_oauth)

            return

        await self._create_oauth_provider(user, auth_info)

    async def _update_oauth_tokens(
        self,
        auth_info: UpdateOAuth,
    ) -> None:
        auth_provider = await self.auth_provider_repo.get_by_user_and_provider(
            auth_info.user_id, auth_info.provider
        )

        if auth_provider and auth_info.access_token:
            token_expires_dt = None
            if auth_info.token_expires_at:
                token_expires_dt = datetime.fromtimestamp(
                    auth_info.token_expires_at, tz=timezone.utc
                )

            encrypted_access = (
                crypto_manager.encrypt(auth_info.access_token)
                if auth_info.access_token
                else None
            )
            encrypted_refresh = (
                crypto_manager.encrypt(auth_info.refresh_token)
                if auth_info.refresh_token
                else None
            )

            update_data = AuthProviderUpdateEncrypted(
                access_token=encrypted_access,
                refresh_token=encrypted_refresh,
                token_expires_at=token_expires_dt,
            )

            await self.auth_provider_repo.update(auth_provider.id, update_data)

    async def get_decrypted_oauth_token(
        self, user_id: str, provider: Provider
    ) -> str | None:
        auth_provider = await self.auth_provider_repo.get_by_user_and_provider(
            user_id, provider
        )

        if auth_provider and auth_provider.access_token:
            return crypto_manager.decrypt(auth_provider.access_token)

        return None
