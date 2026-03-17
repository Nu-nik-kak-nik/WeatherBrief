from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base_weather import Base, engine, new_session


async def get_session():
    async with new_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_models():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


SessionDependency = Annotated[AsyncSession, Depends(get_session)]
