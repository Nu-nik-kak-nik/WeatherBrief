from typing import Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateEntityError, EntityNotFoundError
from app.db.repositories.saved_location import SavedLocationRepository
from app.models.weather import SavedLocation
from app.schemas.weather.saved_location import SavedLocationCreate, SavedLocationUpdate


class LocationService:
    def __init__(self, session: AsyncSession):
        self.repo = SavedLocationRepository(session)

    async def add_location(self, location_data: SavedLocationCreate) -> SavedLocation:
        existing_by_name = (
            await self.repo.get_by_user_and_location_name(
                location_data.user_id,
                location_data.location_name,
                location_data.country,
            )
            if location_data.location_name
            else None
        )
        if existing_by_name:
            raise DuplicateEntityError(
                "Location with this name and country already exists for the user."
            )

        existing_by_coords = await self.repo.get_by_user_and_coordinates(
            location_data.user_id, location_data.latitude, location_data.longitude
        )
        if existing_by_coords:
            raise DuplicateEntityError(
                "Location with these coordinates already exists for the user."
            )

        return await self.repo.create(location_data)

    async def get_location_by_id(self, location_id: str) -> SavedLocation | None:
        return await self.repo.get_by_id(location_id)

    async def get_locations_by_user(self, user_id: str) -> Sequence[SavedLocation]:
        return await self.repo.get_all_by_user_ordered_by_display_order(user_id)

    async def update_location(
        self, location_id: str, location_update: SavedLocationUpdate
    ) -> SavedLocation | None:
        existing = await self.repo.get_by_id(location_id)
        if not existing:
            raise EntityNotFoundError(f"Location with ID {location_id} not found.")

        if location_update.location_name and location_update.country:
            exists = await self.repo.exists_by_user_and_location_name(
                existing.user_id, location_update.location_name, location_update.country
            )
            if exists and existing.location_name != location_update.location_name:
                raise DuplicateEntityError(
                    "Another location with this name and country already exists for the user."
                )

        return await self.repo.update(location_id, location_update)

    async def delete_location(self, location_id: str) -> bool:
        existing = await self.repo.get_by_id(location_id)
        if not existing:
            raise EntityNotFoundError(f"Location with ID {location_id} not found.")
        return await self.repo.delete(location_id)

    async def reorder_locations(self, user_id: str, ordered_ids: list[str]) -> bool:
        user_locations = await self.get_locations_by_user(user_id)
        user_location_ids = {loc.id for loc in user_locations}

        invalid_ids = set(ordered_ids) - user_location_ids
        if invalid_ids:
            raise EntityNotFoundError(
                f"Location IDs not found or do not belong to user: {invalid_ids}"
            )

        for idx, loc_id in enumerate(ordered_ids):
            await self.repo.update_display_order(loc_id, idx)

        return True

    async def get_or_create_location(
        self, location_data: SavedLocationCreate
    ) -> SavedLocation:
        if location_data.location_name and location_data.country:
            existing = await self.repo.get_by_user_and_location_name(
                location_data.user_id,
                location_data.location_name,
                location_data.country,
            )
            if existing:
                return existing

        existing_coords = await self.repo.get_by_user_and_coordinates(
            location_data.user_id, location_data.latitude, location_data.longitude
        )
        if existing_coords:
            return existing_coords

        return await self.add_location(location_data)
