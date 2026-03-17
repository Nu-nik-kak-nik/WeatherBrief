from typing import Sequence

from sqlalchemy import delete, func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateEntityError, EntityNotFoundError
from app.models.weather import AuthProvider
from app.schemas.weather.auth_provider import (
    AuthProviderCreateEncrypted,
    AuthProviderUpdateEncrypted,
)


class AuthProviderRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, auth_id: int) -> AuthProvider | None:
        stmt = select(AuthProvider).where(
            AuthProvider.id == auth_id, AuthProvider.unlinked_at.is_(None)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_provider_and_id(
        self, provider: str, provider_id: str
    ) -> AuthProvider | None:
        stmt = select(AuthProvider).where(
            AuthProvider.provider == provider,
            AuthProvider.provider_id == provider_id,
            AuthProvider.unlinked_at.is_(None),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_provider_and_email(
        self, provider: str, email: str
    ) -> AuthProvider | None:
        stmt = select(AuthProvider).where(
            AuthProvider.provider == provider,
            AuthProvider.provider_email == email,
            AuthProvider.unlinked_at.is_(None),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_user_and_provider(
        self, user_id: str, provider: str
    ) -> AuthProvider | None:
        stmt = select(AuthProvider).where(
            AuthProvider.user_id == user_id,
            AuthProvider.provider == provider,
            AuthProvider.unlinked_at.is_(None),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all_by_user(self, user_id: str) -> Sequence[AuthProvider]:
        stmt = select(AuthProvider).where(
            AuthProvider.user_id == user_id, AuthProvider.unlinked_at.is_(None)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def create(self, auth_data: AuthProviderCreateEncrypted) -> AuthProvider:
        db_auth = AuthProvider(**auth_data.model_dump())
        try:
            self.session.add(db_auth)
            await self.session.flush()
            await self.session.refresh(db_auth)
            await self.session.commit()
        except IntegrityError:
            raise DuplicateEntityError("AuthProvider with this data already exists")
        return db_auth

    async def update(
        self, auth_id: int, auth_update: AuthProviderUpdateEncrypted
    ) -> AuthProvider | None:
        existing = await self.get_by_id(auth_id)
        if not existing:
            raise EntityNotFoundError(f"AuthProvider with ID {auth_id} not found")

        stmt = (
            update(AuthProvider)
            .where(AuthProvider.id == auth_id)
            .values(**auth_update.model_dump(exclude_unset=True))
        )
        await self.session.execute(stmt)
        await self.session.commit()

        return await self.get_by_id(auth_id)

    async def unlink(self, auth_id: int) -> bool:
        existing = await self.get_by_id(auth_id)
        if not existing:
            raise EntityNotFoundError(f"AuthProvider with ID {auth_id} not found")

        stmt = (
            update(AuthProvider)
            .where(AuthProvider.id == auth_id)
            .values(unlinked_at=func.now())
        )
        await self.session.execute(stmt)
        await self.session.commit()
        return True

    async def delete(self, auth_id: int) -> bool:
        existing = await self.get_by_id(auth_id)
        if not existing:
            raise EntityNotFoundError(f"AuthProvider with ID {auth_id} not found")

        stmt = delete(AuthProvider).where(AuthProvider.id == auth_id)
        await self.session.execute(stmt)
        await self.session.commit()
        return True

    async def exists_by_provider_and_id(self, provider: str, provider_id: str) -> bool:
        stmt = select(AuthProvider.id).where(
            AuthProvider.provider == provider, AuthProvider.provider_id == provider_id
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none() is not None

    async def exists_by_provider_and_email(self, provider: str, email: str) -> bool:
        stmt = select(AuthProvider.id).where(
            AuthProvider.provider == provider, AuthProvider.provider_email == email
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none() is not None
