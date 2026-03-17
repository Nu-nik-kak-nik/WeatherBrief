from typing import Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateEntityError, EntityNotFoundError
from app.db.repositories.user_api_key import UserAPIKeyRepository
from app.models.weather import UserAPIKey
from app.schemas.weather.user_api_key import UserAPIKeyCreate, UserAPIKeyUpdate


class APIKeyService:
    def __init__(self, session: AsyncSession):
        self.repo = UserAPIKeyRepository(session)

    async def add_api_key(self, key_data: UserAPIKeyCreate) -> UserAPIKey:
        exists = await self.repo.exists_by_user_and_service(
            key_data.user_id, key_data.service
        )
        if exists:
            raise DuplicateEntityError(
                "An API key for this service already exists for the user."
            )

        return await self.repo.create(key_data)

    async def get_api_key_by_id(self, key_id: str) -> UserAPIKey | None:
        return await self.repo.get_by_id(key_id)

    async def get_active_api_key_by_user_and_service(
        self, user_id: str, service: str
    ) -> UserAPIKey | None:
        return await self.repo.get_active_by_user_and_service(user_id, service)

    async def get_all_api_keys_by_user(self, user_id: str) -> Sequence[UserAPIKey]:
        return await self.repo.get_all_by_user(user_id)

    async def update_api_key(
        self, key_id: str, key_update: UserAPIKeyUpdate
    ) -> UserAPIKey | None:
        existing = await self.repo.get_by_id(key_id)
        if not existing:
            raise EntityNotFoundError(f"API key with ID {key_id} not found.")

        return await self.repo.update(key_id, key_update)

    async def delete_api_key(self, key_id: str) -> bool:
        existing = await self.repo.get_by_id(key_id)
        if not existing:
            raise EntityNotFoundError(f"API key with ID {key_id} not found.")
        return await self.repo.delete(key_id)

    async def deactivate_api_key(self, key_id: str) -> bool:
        existing = await self.repo.get_by_id(key_id)
        if not existing:
            raise EntityNotFoundError(f"API key with ID {key_id} not found.")
        return await self.repo.deactivate(key_id)

    async def activate_api_key(self, key_id: str) -> bool:
        existing = await self.repo.get_by_id(key_id)
        if not existing:
            raise EntityNotFoundError(f"API key with ID {key_id} not found.")

        return await self.repo.activate(key_id)

    async def get_decrypted_api_key(self, key_id: str) -> str:
        return await self.repo.get_decrypted_key(key_id)

    async def verify_api_key_exists_for_user_and_service(
        self, user_id: str, service: str
    ) -> bool:
        return await self.repo.exists_by_user_and_service(user_id, service)
