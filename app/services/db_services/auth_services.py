from typing import Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.core_settings import Provider
from app.core.exceptions import DuplicateEntityError, EntityNotFoundError
from app.db.repositories.auth_provider import AuthProviderRepository
from app.models.weather import AuthProvider
from app.schemas.weather.auth_provider import (
    AuthProviderCreate,
    AuthProviderCreateEncrypted,
    AuthProviderUpdate,
    AuthProviderUpdateEncrypted,
    AuthProviderUpdateUser,
)
from app.services.utils.crypto import crypto_manager


class AuthProviderService:
    def __init__(self, session: AsyncSession):
        self.repo = AuthProviderRepository(session)

    async def link_user_to_provider(
        self, auth_data: AuthProviderCreate
    ) -> AuthProvider:
        existing_by_id = await self.repo.get_by_provider_and_id(
            auth_data.provider, auth_data.provider_id
        )
        if existing_by_id:
            raise DuplicateEntityError(
                "AuthProvider with this provider_id already exists."
            )

        if auth_data.provider_email:
            existing_by_email = await self.repo.get_by_provider_and_email(
                auth_data.provider, auth_data.provider_email
            )
            if existing_by_email:
                raise DuplicateEntityError(
                    "AuthProvider with this email already exists."
                )

        existing_user_provider = await self.repo.get_by_user_and_provider(
            auth_data.user_id, auth_data.provider
        )
        if existing_user_provider:
            raise DuplicateEntityError("User is already linked to this provider.")

        encrypted_access_token = (
            crypto_manager.encrypt(auth_data.access_token)
            if auth_data.access_token
            else None
        )
        encrypted_refresh_token = (
            crypto_manager.encrypt(auth_data.refresh_token)
            if auth_data.refresh_token
            else None
        )

        encrypted_data = AuthProviderCreateEncrypted(
            user_id=auth_data.user_id,
            provider=auth_data.provider,
            provider_id=auth_data.provider_id,
            provider_email=auth_data.provider_email,
            provider_username=auth_data.provider_username,
            profile_data=auth_data.profile_data,
            access_token=encrypted_access_token,
            refresh_token=encrypted_refresh_token,
            token_expires_at=auth_data.token_expires_at,
        )

        return await self.repo.create(encrypted_data)

    async def get_provider_by_id(self, auth_id: int) -> AuthProvider | None:
        return await self.repo.get_by_id(auth_id)

    async def get_provider_by_user_and_provider(
        self, user_id: str, provider: str
    ) -> AuthProvider | None:
        return await self.repo.get_by_user_and_provider(user_id, provider)

    async def get_all_providers_by_user(self, user_id: str) -> Sequence[AuthProvider]:
        return await self.repo.get_all_by_user(user_id)

    async def update_provider(
        self, auth_id: int, auth_update: AuthProviderUpdate
    ) -> AuthProvider | None:
        existing = await self.repo.get_by_id(auth_id)
        if not existing:
            raise EntityNotFoundError(f"AuthProvider with ID {auth_id} not found.")

        if auth_update.provider_email:
            exists = await self.repo.exists_by_provider_and_email(
                existing.provider, auth_update.provider_email
            )
            if exists and existing.provider_email != auth_update.provider_email:
                raise DuplicateEntityError(
                    "Another provider with this email already exists."
                )

        encrypted_access_token = (
            crypto_manager.encrypt(auth_update.access_token)
            if auth_update.access_token
            else None
        )
        encrypted_refresh_token = (
            crypto_manager.encrypt(auth_update.refresh_token)
            if auth_update.refresh_token
            else None
        )

        encrypted_update = AuthProviderUpdateEncrypted(
            provider_email=auth_update.provider_email,
            provider_username=auth_update.provider_username,
            profile_data=auth_update.profile_data,
            access_token=encrypted_access_token,
            refresh_token=encrypted_refresh_token,
            token_expires_at=auth_update.token_expires_at,
            unlinked_at=auth_update.unlinked_at,
        )

        return await self.repo.update(auth_id, encrypted_update)

    async def unlink_provider(self, auth_id: int) -> bool:
        return await self.repo.unlink(auth_id)

    async def delete_provider(self, auth_id: int) -> bool:
        existing = await self.repo.get_by_id(auth_id)
        if not existing:
            raise EntityNotFoundError(f"AuthProvider with ID {auth_id} not found.")
        return await self.repo.delete(auth_id)

    async def is_provider_linked(self, auth_id: int) -> bool:
        provider = await self.repo.get_by_id(auth_id)
        if not provider:
            raise EntityNotFoundError(f"AuthProvider with ID {auth_id} not found.")
        return provider.is_active

    async def get_decrypted_token(self, user_id: str, provider: Provider) -> str | None:
        auth = await self.repo.get_by_user_and_provider(user_id, provider)
        if auth and auth.access_token:
            return crypto_manager.decrypt(auth.access_token)
        return None

    async def update_provider_user_fields(
        self,
        auth_id: int,
        auth_update: AuthProviderUpdateUser,
    ) -> AuthProvider | None:
        existing = await self.repo.get_by_id(auth_id)
        if not existing:
            raise EntityNotFoundError(f"AuthProvider {auth_id} not found")

        update_data = AuthProviderUpdateEncrypted(
            provider_username=auth_update.provider_username,
            profile_data=auth_update.profile_data,
        )
        return await self.repo.update(auth_id, update_data)
