from typing import Sequence

from fastapi import APIRouter, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.auth import CurrentUser
from app.core.core_settings import core_settings
from app.core.exceptions import DuplicateEntityError, EntityNotFoundError
from app.core.logger import logger
from app.db.session_weather import SessionDependency
from app.models.weather import AuthProvider
from app.schemas.weather.auth_provider import (
    AuthProviderOut,
    AuthProviderUpdateUser,
)
from app.services.db_services.auth_services import AuthProviderService
from app.services.utils.validation import ensure_exists, ensure_user_access

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/auth/providers", tags=["Auth Providers"])


@router.get("/", response_model=list[AuthProviderOut])
async def get_auth_providers(
    current_user: CurrentUser,
    session: SessionDependency,
) -> Sequence[AuthProvider]:

    service = AuthProviderService(session)
    return await service.get_all_providers_by_user(current_user.id)


@router.get("/{auth_id}", response_model=AuthProviderOut)
async def get_provider_by_id(
    auth_id: int,
    current_user: CurrentUser,
    session: SessionDependency,
) -> AuthProvider:

    service = AuthProviderService(session)
    provider = await service.get_provider_by_id(auth_id)

    provider = ensure_exists(provider, core_settings.provider_error_message)
    ensure_user_access(current_user.id, provider.user_id)

    return provider


@router.put("/{auth_id}", response_model=AuthProviderOut)
@limiter.limit("3/minute")
async def update_provider(
    request: Request,
    auth_id: int,
    auth_update: AuthProviderUpdateUser,
    current_user: CurrentUser,
    session: SessionDependency,
) -> AuthProvider | None:

    service = AuthProviderService(session)
    provider = await service.get_provider_by_id(auth_id)
    provider = ensure_exists(provider, "Provider not found")
    ensure_user_access(current_user.id, provider.user_id)

    try:
        updated = await service.update_provider_user_fields(auth_id, auth_update)
        changed_fields = auth_update.model_dump(exclude_unset=True).keys()
        if changed_fields:
            logger.info(
                f"Auth provider updated: provider_id={auth_id} | "
                f"user_id={current_user.id} | fields={list(changed_fields)}"
            )
        return updated

    except DuplicateEntityError as e:
        logger.warning(
            f"Failed to update auth provider: duplicate | "
            f"provider_id={auth_id} | user_id={current_user.id}"
        )
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        logger.error(
            f"Unexpected error updating auth provider: provider_id={auth_id} | "
            f"user_id={current_user.id} | error={type(e).__name__}: {e}"
        )
        raise


@router.delete("/{auth_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("1/minute")
async def delete_provider(
    request: Request,
    auth_id: int,
    current_user: CurrentUser,
    session: SessionDependency,
):

    service = AuthProviderService(session)
    provider = await service.get_provider_by_id(auth_id)

    provider = ensure_exists(provider, core_settings.provider_error_message)
    ensure_user_access(current_user.id, provider.user_id)

    try:
        deleted = await service.delete_provider(auth_id)

    except EntityNotFoundError as e:
        logger.warning(
            f"Failed to delete auth provider: not found | "
            f"provider_id={auth_id} | user_id={current_user.id}"
        )
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    if not deleted:
        logger.error(
            f"Failed to delete auth provider: service returned False | "
            f"provider_id={auth_id} | user_id={current_user.id}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unlink provider",
        )

    logger.info(
        f"Auth provider unlinked: provider_id={auth_id} | "
        f"user_id={current_user.id} | provider_type={provider.provider_type}"
    )
