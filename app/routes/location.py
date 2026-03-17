from typing import Sequence

from fastapi import APIRouter, HTTPException, status

from app.core.auth import CurrentUser
from app.core.core_settings import core_settings
from app.core.exceptions import DuplicateEntityError, EntityNotFoundError
from app.core.logger import logger
from app.db.session_weather import SessionDependency
from app.models.weather import SavedLocation
from app.schemas.weather.saved_location import (
    ReorderLocationsRequest,
    SavedLocationCreate,
    SavedLocationOut,
    SavedLocationUpdate,
)
from app.services.db_services.location_services import LocationService
from app.services.utils.validation import ensure_exists, ensure_user_access, get_api_key
from app.services.weather.clients import openweather_client

router = APIRouter(prefix="/locations", tags=["locations"])


@router.get("/", response_model=list[SavedLocationOut])
async def get_saved_locations(
    session: SessionDependency, current_user: CurrentUser
) -> Sequence[SavedLocation]:
    service = LocationService(session)
    return await service.get_locations_by_user(current_user.id)


@router.get("/{location_id}", response_model=SavedLocationOut)
async def get_saved_location_by_id(
    location_id: str,
    current_user: CurrentUser,
    session: SessionDependency,
) -> SavedLocation:

    service = LocationService(session)
    location = await service.get_location_by_id(location_id)

    location = ensure_exists(location, core_settings.local_error_message)
    ensure_user_access(current_user.id, location.user_id)

    return location


@router.post("/", response_model=SavedLocationOut)
async def add_location(
    location_data: SavedLocationCreate,
    session: SessionDependency,
    current_user: CurrentUser,
) -> SavedLocation:

    ensure_user_access(current_user.id, location_data.user_id)
    api_key = await get_api_key(current_user, session)
    try:
        results = await openweather_client.search_location_by_coordinates(
            lat=location_data.latitude,
            lon=location_data.longitude,
            api_key=str(api_key) if api_key else None,
        )
    except Exception as e:
        logger.warning(
            f"Failed to verify location coordinates: lat={location_data.latitude}, "
            f"lon={location_data.longitude} | error={type(e).__name__}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to verify location coordinates: lat={location_data.latitude}, lon={location_data.longitude}, {str(e)}",
        )

    if not results:
        logger.warning(
            f"Location not found in OpenWeatherMap: lat={location_data.latitude}, "
            f"lon={location_data.longitude} | user_id={current_user.id}"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Location not found in OpenWeatherMap",
        )

    service = LocationService(session)

    try:
        new_location = await service.add_location(location_data)
        logger.info(
            f"Location added: location_id={new_location.id} | "
            f"user_id={current_user.id} | name={location_data.location_name or 'Unnamed'}"
        )
        return new_location

    except DuplicateEntityError as e:
        logger.warning(
            f"Failed to add location: already exists for user | "
            f"user_id={current_user.id} | coords=({location_data.latitude}, {location_data.longitude})"
        )
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    except Exception as e:
        logger.error(
            f"Unexpected error adding location: user_id={current_user.id} | "
            f"error={type(e).__name__}: {e}"
        )
        raise


@router.delete("/{location_id}", response_model=dict[str, str])
async def delete_location(
    location_id: str,
    current_user: CurrentUser,
    session: SessionDependency,
) -> dict[str, str]:
    service = LocationService(session)
    location = await service.get_location_by_id(location_id)

    location = ensure_exists(location, core_settings.local_error_message)
    ensure_user_access(current_user.id, location.user_id)

    try:
        await service.delete_location(location_id)
        logger.info(
            f"Location deleted: location_id={location_id} | user_id={current_user.id}"
        )

    except EntityNotFoundError:
        logger.warning(
            f"Failed to delete location: not found | location_id={location_id} | user_id={current_user.id}"
        )

    return {"message": "Location deleted successfully"}


@router.put("/reorder", response_model=list[SavedLocationOut])
async def reorder_user_locations(
    request: ReorderLocationsRequest,
    current_user: CurrentUser,
    session: SessionDependency,
) -> Sequence[SavedLocation]:
    services = LocationService(session)
    try:
        success = await services.reorder_locations(
            current_user.id, request.location_ids
        )
        if not success:
            logger.warning(
                f"Failed to reorder locations: invalid order | user_id={current_user.id} | count={len(request.location_ids)}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid order"
            )
    except EntityNotFoundError as e:
        logger.warning(
            f"Failed to reorder locations: location not found | user_id={current_user.id} | error={e}"
        )
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    return await services.get_locations_by_user(current_user.id)


@router.put("/{location_id}", response_model=SavedLocationOut)
async def update_location(
    location_id: str,
    location_update: SavedLocationUpdate,
    current_user: CurrentUser,
    session: SessionDependency,
) -> SavedLocation | None:
    service = LocationService(session)
    location = await service.get_location_by_id(location_id)

    location = ensure_exists(location, core_settings.local_error_message)
    ensure_user_access(current_user.id, location.user_id)

    try:
        updated = await service.update_location(location_id, location_update)
        changed_fields = location_update.model_dump(exclude_unset=True).keys()
        if changed_fields:
            logger.info(
                f"Location updated: location_id={location_id} | user_id={current_user.id} | fields={list(changed_fields)}"
            )
        return updated

    except DuplicateEntityError as e:
        logger.warning(
            f"Failed to update location: duplicate name | location_id={location_id} | user_id={current_user.id}"
        )
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except EntityNotFoundError as e:
        logger.warning(
            f"Failed to update location: not found | location_id={location_id} | user_id={current_user.id}"
        )
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(
            f"Unexpected error updating location: location_id={location_id} | user_id={current_user.id} | error={type(e).__name__}: {e}"
        )
        raise
