from typing import Sequence

from fastapi import APIRouter, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.auth import (
    CurrentUser,
)
from app.core.core_settings import core_settings
from app.core.exceptions import DuplicateEntityError
from app.core.logger import logger
from app.db.session_weather import SessionDependency
from app.models.weather import UserAPIKey
from app.schemas.weather.user_api_key import (
    UserAPIKeyCreate,
    UserAPIKeyOut,
    UserAPIKeyUpdate,
)
from app.services.db_services.api_key_services import APIKeyService
from app.services.utils.validation import ensure_exists, ensure_user_access

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/api-keys", tags=["API Keys"])


@router.get("/", response_model=list[UserAPIKeyOut])
async def get_api_keys(
    session: SessionDependency, user: CurrentUser
) -> Sequence[UserAPIKey]:

    service = APIKeyService(session)
    try:
        return await service.get_all_api_keys_by_user(user.id)

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/{key_id}", response_model=UserAPIKeyOut)
async def get_api_key_by_id(
    key_id: str,
    current_user: CurrentUser,
    session: SessionDependency,
) -> UserAPIKey | None:

    service = APIKeyService(session)
    key = await service.get_api_key_by_id(key_id)

    key = ensure_exists(key, core_settings.key_error_message)
    ensure_user_access(key.user_id, current_user.id)

    return key


@router.post("/", response_model=UserAPIKeyOut)
async def add_api_key(
    key_data: UserAPIKeyCreate,
    current_user: CurrentUser,
    session: SessionDependency,
) -> UserAPIKey:

    ensure_user_access(key_data.user_id, current_user.id)
    service = APIKeyService(session)

    try:
        new_key = await service.add_api_key(key_data)
        logger.info(
            f"API key created: key_id={new_key.id} | user_id={current_user.id} | name={key_data.name_key or 'Unnamed'}"
        )
        return new_key

    except DuplicateEntityError as e:
        logger.warning(
            f"Failed to create API key: name already exists | user_id={current_user.id} | name={key_data.name_key}"
        )
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        logger.error(
            f"Unexpected error creating API key: user_id={current_user.id} | error={type(e).__name__}: {e}"
        )
        raise


@router.put("/{key_id}", response_model=UserAPIKeyOut)
@limiter.limit(core_settings.strong_limit_request)
async def update_api_key(
    request: Request,
    key_id: str,
    key_update: UserAPIKeyUpdate,
    current_user: CurrentUser,
    session: SessionDependency,
) -> UserAPIKey | None:

    service = APIKeyService(session)
    key = await service.get_api_key_by_id(key_id)

    key = ensure_exists(key, core_settings.key_error_message)
    ensure_user_access(key.user_id, current_user.id)

    try:
        updated = await service.update_api_key(key_id, key_update)
        changed_fields = key_update.model_dump(exclude_unset=True).keys()
        if changed_fields:
            logger.info(
                f"API key updated: key_id={key_id} | user_id={current_user.id} | fields={list(changed_fields)}"
            )
        return updated

    except DuplicateEntityError as e:
        logger.warning(
            f"Failed to update API key: duplicate name | key_id={key_id} | user_id={current_user.id}"
        )
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    except Exception as e:
        logger.error(
            f"Unexpected error updating API key: key_id={key_id} | user_id={current_user.id} | error={type(e).__name__}: {e}"
        )
        raise


@router.delete("/{key_id}", response_model=dict)
@limiter.limit(core_settings.average_limit_request)
async def delete_api_key(
    request: Request,
    key_id: str,
    current_user: CurrentUser,
    session: SessionDependency,
) -> dict:

    service = APIKeyService(session)
    key = await service.get_api_key_by_id(key_id)

    key = ensure_exists(key, core_settings.key_error_message)
    ensure_user_access(key.user_id, current_user.id)

    deleted = await service.delete_api_key(key_id)

    if not deleted:
        logger.warning(
            f"Failed to delete API key: not found or already deleted | key_id={key_id} | user_id={current_user.id}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete API key",
        )

    logger.info(f"API key deleted: key_id={key_id} | user_id={current_user.id}")
    return {"message": "API key deleted successfully"}


@router.patch("/{key_id}/activate", response_model=dict)
@limiter.limit(core_settings.strong_limit_request)
async def activate_api_key(
    request: Request,
    key_id: str,
    current_user: CurrentUser,
    session: SessionDependency,
) -> dict:

    service = APIKeyService(session)
    key = await service.get_api_key_by_id(key_id)

    key = ensure_exists(key, core_settings.key_error_message)
    ensure_user_access(key.user_id, current_user.id)

    try:
        result = await service.activate_api_key(key_id)
        logger.info(f"API key activated: key_id={key_id} | user_id={current_user.id}")
        return {"key activated": result}

    except Exception as e:
        logger.error(
            f"Failed to activate API key: key_id={key_id} | user_id={current_user.id} | error={type(e).__name__}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.patch("/{key_id}/deactivate", response_model=dict)
@limiter.limit(core_settings.strong_limit_request)
async def deactivate_api_key(
    request: Request,
    key_id: str,
    current_user: CurrentUser,
    session: SessionDependency,
) -> dict:

    service = APIKeyService(session)
    key = await service.get_api_key_by_id(key_id)

    key = ensure_exists(key, core_settings.key_error_message)
    ensure_user_access(key.user_id, current_user.id)

    try:
        result = await service.deactivate_api_key(key_id)
        logger.info(f"API key deactivated: key_id={key_id} | user_id={current_user.id}")
        return {"key deactivated": result}

    except Exception as e:
        logger.error(
            f"Failed to deactivated API key: key_id={key_id} | user_id={current_user.id} | error={type(e).__name__}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.get("/{key_id}/decrypt", response_model=dict)
@limiter.limit(core_settings.strong_limit_request)
async def get_decrypted_api_key(
    request: Request,
    key_id: str,
    current_user: CurrentUser,
    session: SessionDependency,
) -> dict:
    service = APIKeyService(session)
    key = await service.get_api_key_by_id(key_id)

    key = ensure_exists(key, core_settings.key_error_message)
    ensure_user_access(key.user_id, current_user.id)

    logger.info(
        f"API key decrypted (viewed): key_id={key_id} | user_id={current_user.id}"
    )

    decrypted_key = await service.get_decrypted_api_key(key_id)
    return {"decrypted_key": decrypted_key}
