from typing import Sequence

from sqlalchemy import delete, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateEntityError
from app.models.weather import SavedLocation
from app.schemas.weather.saved_location import SavedLocationCreate, SavedLocationUpdate


class SavedLocationRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, location_id: str) -> SavedLocation | None:
        stmt = select(SavedLocation).where(SavedLocation.id == location_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_user_and_location_name(
        self, user_id: str, location_name: str, country: str
    ) -> SavedLocation | None:
        stmt = select(SavedLocation).where(
            SavedLocation.user_id == user_id,
            SavedLocation.location_name == location_name,
            SavedLocation.country == country,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_user_and_coordinates(
        self, user_id: str, latitude: float, longitude: float
    ) -> SavedLocation | None:
        stmt = select(SavedLocation).where(
            SavedLocation.user_id == user_id,
            SavedLocation.latitude == latitude,
            SavedLocation.longitude == longitude,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all_by_user_ordered_by_display_order(
        self, user_id: str
    ) -> Sequence[SavedLocation]:
        stmt = (
            select(SavedLocation)
            .where(SavedLocation.user_id == user_id)
            .order_by(SavedLocation.display_order.asc())
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_locations_by_coordinates(
        self, latitude: float, longitude: float
    ) -> Sequence[SavedLocation]:
        stmt = select(SavedLocation).where(
            SavedLocation.latitude == latitude, SavedLocation.longitude == longitude
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def create(self, location_data: SavedLocationCreate) -> SavedLocation:
        db_location = SavedLocation(**location_data.model_dump())
        try:
            self.session.add(db_location)
            await self.session.flush()
            await self.session.refresh(db_location)
            await self.session.commit()
        except IntegrityError:
            raise DuplicateEntityError(
                "The location with these coordinates or name is already saved by the user"
            )
        return db_location

    async def update(
        self, location_id: str, location_update: SavedLocationUpdate
    ) -> SavedLocation | None:
        stmt = (
            update(SavedLocation)
            .where(SavedLocation.id == location_id)
            .values(**location_update.model_dump(exclude_unset=True))
        )
        await self.session.execute(stmt)
        await self.session.commit()

        return await self.get_by_id(location_id)

    async def delete(self, location_id: str) -> bool:
        stmt = delete(SavedLocation).where(SavedLocation.id == location_id)
        await self.session.execute(stmt)
        await self.session.commit()
        return True

    async def reorder_locations(self, user_id: str, ordered_ids: list[str]) -> bool:
        for idx, loc_id in enumerate(ordered_ids):
            stmt = (
                update(SavedLocation)
                .where(SavedLocation.id == loc_id, SavedLocation.user_id == user_id)
                .values(display_order=idx)
            )
            await self.session.execute(stmt)
        await self.session.commit()
        return True

    async def update_display_order(self, location_id: str, display_order: int) -> bool:
        stmt = (
            update(SavedLocation)
            .where(SavedLocation.id == location_id)
            .values(display_order=display_order)
        )
        await self.session.execute(stmt)
        await self.session.commit()

        return True

    async def exists_by_user_and_location_name(
        self, user_id: str, location_name: str, country: str
    ) -> bool:
        stmt = select(SavedLocation.id).where(
            SavedLocation.user_id == user_id,
            SavedLocation.location_name == location_name,
            SavedLocation.country == country,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none() is not None

    async def exists_by_user_and_coordinates(
        self, user_id: str, latitude: float, longitude: float
    ) -> bool:
        stmt = select(SavedLocation.id).where(
            SavedLocation.user_id == user_id,
            SavedLocation.latitude == latitude,
            SavedLocation.longitude == longitude,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none() is not None
