from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import delete, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import func as sa_func

from app.core.core_settings import Provider
from app.core.exceptions import DuplicateEntityError, EntityNotFoundError
from app.models.weather import AuthProvider, User
from app.schemas.weather.user import UserCreate, UserUpdate
from app.services.utils.security import hasher


class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(
        self,
        user_id: str,
        providers: bool = False,
        locations: bool = False,
        keys: bool = False,
        check_active: bool = True,
    ) -> User | None:
        try:
            uuid_obj = UUID(user_id, version=4)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid user UUID: {user_id}")

        query = select(User).where(User.id == user_id)
        if check_active:
            query = query.where(User.is_active)

        if providers:
            query = query.options(selectinload(User.auth_providers))
        if locations:
            query = query.options(selectinload(User.save_locations))
        if keys:
            query = query.options(selectinload(User.api_keys))

        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        stmt = select(User).where(User.email == email, User.is_active)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> User | None:
        stmt = select(User).where(User.username == username, User.is_active)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, user_create: UserCreate) -> User:
        if user_create.email and await self.get_by_email(user_create.email):
            raise DuplicateEntityError("A user with this email already exists")
        if user_create.username and await self.get_by_username(user_create.username):
            raise DuplicateEntityError("A user with this username already exists")

        user_dict = user_create.model_dump(exclude_unset=True)
        if user_create.hashed_password:
            user_dict["hashed_password"] = hasher.hash_value(
                user_create.hashed_password
            )

        db_user = User(**user_dict)
        try:
            self.session.add(db_user)
            await self.session.flush()
            await self.session.refresh(db_user)
            await self.session.commit()
        except IntegrityError:
            raise DuplicateEntityError(
                "Failed to create user due to uniqueness conflict"
            )

        return db_user

    async def update(self, user_id: str, user_update: UserUpdate) -> User | None:
        existing_user = await self.get_by_id(user_id)
        if not existing_user:
            raise EntityNotFoundError(f"User with ID {user_id} not found")

        stmt = (
            update(User)
            .where(User.id == user_id)
            .values(**user_update.model_dump(exclude_unset=True))
        )
        await self.session.execute(stmt)
        await self.session.commit()

        return await self.get_by_id(user_id)

    async def update_password(
        self, user_id: str, hashed_new_password: str
    ) -> User | None:
        existing_user = await self.get_by_id(user_id)
        if not existing_user:
            raise EntityNotFoundError(f"User with ID {user_id} not found")

        stmt = (
            update(User)
            .where(User.id == user_id)
            .values(hashed_password=hashed_new_password)
        )
        await self.session.execute(stmt)
        await self.session.commit()

        return await self.get_by_id(user_id)

    async def update_last_login(self, user_id: str) -> User | None:
        stmt = (
            update(User).where(User.id == user_id).values(last_login_at=sa_func.now())
        )
        await self.session.execute(stmt)
        await self.session.commit()

        return await self.get_by_id(user_id)

    async def delete(self, user_id: str) -> bool:
        existing_user = await self.get_by_id(user_id)
        if not existing_user:
            raise EntityNotFoundError(f"User with ID {user_id} not found.")
        stmt = delete(User).where(User.id == user_id)
        await self.session.execute(stmt)
        await self.session.commit()
        return True

    async def exists_by_email(self, email: str) -> bool:
        stmt = select(User.id).where(User.email == email, User.is_active)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none() is not None

    async def exists_by_username(self, username: str) -> bool:
        stmt = select(User.id).where(User.username == username, User.is_active)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none() is not None

    async def verify_password(self, user_id: str, plain_password: str) -> bool:
        user = await self.get_by_id(user_id)
        if not user or not user.hashed_password:
            return False
        return hasher.verify_value(plain_password, user.hashed_password)

    async def update_refresh_token(
        self, user_id: str, refresh_token: str
    ) -> User | None:
        existing_user = await self.get_by_id(user_id, check_active=False)
        if not existing_user:
            raise EntityNotFoundError(f"User with ID {user_id} not found")

        stmt = (
            update(User).where(User.id == user_id).values(refresh_token=refresh_token)
        )
        await self.session.execute(stmt)
        await self.session.commit()

        return await self.get_by_id(user_id, check_active=False)

    async def set_user_active_status(
        self, user_id: str, is_active: bool
    ) -> User | None:
        existing_user = await self.get_by_id(user_id, check_active=False)
        if not existing_user:
            raise EntityNotFoundError(f"User with ID {user_id} not found")

        stmt = update(User).where(User.id == user_id).values(is_active=is_active)
        await self.session.execute(stmt)
        await self.session.commit()

        return await self.get_by_id(user_id, check_active=False)

    async def activate_user(self, user_id: str) -> User | None:
        return await self.set_user_active_status(user_id, is_active=True)

    async def deactivate_user(self, user_id: str) -> User | None:
        return await self.set_user_active_status(user_id, is_active=False)

    async def get_by_oauth_provider(
        self, provider: Provider, provider_id: str
    ) -> User | None:
        result = await self.session.execute(
            select(AuthProvider)
            .where(
                AuthProvider.provider == provider,
                AuthProvider.provider_id == provider_id,
                AuthProvider.unlinked_at.is_(None),
            )
            .options(selectinload(AuthProvider.user))
        )
        auth_provider = result.scalar_one_or_none()
        return auth_provider.user if auth_provider else None
