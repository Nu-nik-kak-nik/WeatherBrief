from typing import Sequence

from sqlalchemy import delete, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateEntityError, EntityNotFoundError
from app.models.weather import UserAPIKey
from app.schemas.weather.user_api_key import UserAPIKeyCreate, UserAPIKeyUpdate
from app.services.utils.crypto import crypto_manager


class UserAPIKeyRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, key_id: str) -> UserAPIKey | None:
        stmt = select(UserAPIKey).where(UserAPIKey.id == key_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_user_and_service(
        self, user_id: str, service: str
    ) -> UserAPIKey | None:
        stmt = select(UserAPIKey).where(
            UserAPIKey.user_id == user_id, UserAPIKey.service == service
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all_by_user(self, user_id: str) -> Sequence[UserAPIKey]:
        stmt = select(UserAPIKey).where(UserAPIKey.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_active_by_user_and_service(
        self, user_id: str, service: str
    ) -> UserAPIKey | None:
        stmt = select(UserAPIKey).where(
            UserAPIKey.user_id == user_id,
            UserAPIKey.service == service,
            UserAPIKey.is_active.is_(True),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_decrypted_key(self, key_id: str) -> str:
        record = await self.get_by_id(key_id)
        if not record:
            raise EntityNotFoundError(f"API key with ID {key_id} not found")

        if isinstance(record.encrypted_key, str):
            encrypted_bytes = record.encrypted_key.encode()
        elif isinstance(record.encrypted_key, bytes):
            encrypted_bytes = record.encrypted_key
        else:
            raise TypeError("Unexpected type for encrypted_key")

        return crypto_manager.decrypt(encrypted_bytes)

    async def create(self, key_data: UserAPIKeyCreate) -> UserAPIKey:
        encrypted_key = crypto_manager.encrypt(key_data.plain_key)
        last_four = key_data.plain_key[-4:]
        key_data_dict = key_data.model_dump(exclude={"plain_key"})
        db_key = UserAPIKey(
            encrypted_key=encrypted_key, last_four=last_four, **key_data_dict
        )
        try:
            self.session.add(db_key)
            await self.session.flush()
            await self.session.refresh(db_key)
            await self.session.commit()
        except IntegrityError:
            raise DuplicateEntityError("An API key for this service already exists")
        return db_key

    async def update(
        self, key_id: str, key_update: UserAPIKeyUpdate
    ) -> UserAPIKey | None:
        values_to_update = key_update.model_dump(
            exclude={"plain_key"}, exclude_unset=True
        )

        if key_update.plain_key is not None:
            encrypted_key = crypto_manager.encrypt(key_update.plain_key)
            last_four = key_update.plain_key[-4:]

            values_to_update["encrypted_key"] = encrypted_key
            values_to_update["last_four"] = last_four

        stmt = (
            update(UserAPIKey).where(UserAPIKey.id == key_id).values(**values_to_update)
        )
        await self.session.execute(stmt)
        await self.session.commit()

        return await self.get_by_id(key_id)

    async def delete(self, key_id: str) -> bool:
        stmt = delete(UserAPIKey).where(UserAPIKey.id == key_id)
        await self.session.execute(stmt)
        await self.session.commit()
        return True

    async def deactivate(self, key_id: str) -> bool:
        stmt = update(UserAPIKey).where(UserAPIKey.id == key_id).values(is_active=False)
        await self.session.execute(stmt)
        await self.session.commit()
        return True

    async def activate(self, key_id: str) -> bool:
        stmt = update(UserAPIKey).where(UserAPIKey.id == key_id).values(is_active=True)
        await self.session.execute(stmt)
        await self.session.commit()
        return True

    async def exists_by_user_and_service(self, user_id: str, service: str) -> bool:
        stmt = select(UserAPIKey.id).where(
            UserAPIKey.user_id == user_id, UserAPIKey.service == service
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none() is not None

    async def exists_by_user_and_key(self, user_id: str, key: str) -> bool:
        stmt = select(UserAPIKey.id).where(
            UserAPIKey.user_id == user_id,
            UserAPIKey.encrypted_key == crypto_manager.encrypt(key),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none() is not None
