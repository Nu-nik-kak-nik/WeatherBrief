from fastapi import APIRouter, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.auth import CurrentUser
from app.core.core_settings import core_settings
from app.core.exceptions import EntityNotFoundError
from app.core.logger import logger
from app.db.session_weather import SessionDependency
from app.models.weather import User
from app.schemas.weather.user import UserIsActive, UserProfile, UserUpdate
from app.services.db_services.user_service import UserService

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/profile", response_model=UserProfile)
@limiter.limit(core_settings.light_limit_request)
async def get_profile(request: Request, current_user: CurrentUser) -> User:
    return current_user


@router.put("/profile", response_model=UserProfile)
@limiter.limit(core_settings.strong_limit_request)
async def update_profile(
    request: Request,
    user_update: UserUpdate,
    current_user: CurrentUser,
    session: SessionDependency,
) -> User | None:
    service = UserService(session)

    try:
        updated_user = await service.update_user(current_user.id, user_update)
        logger.info(
            f"Profile updated: user_id={current_user.id} | fields={list(user_update.model_dump(exclude_unset=True).keys())}"
        )
        return updated_user

    except EntityNotFoundError as e:
        logger.warning(
            f"Profile update failed: user not found | user_id={current_user.id}"
        )
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    except Exception as e:
        logger.error(
            f"Unexpected error in profile update: user_id={current_user.id} | error={type(e).__name__}: {e}"
        )
        raise


@router.post("/change-password", response_model=dict[str, str])
@limiter.limit(core_settings.very_strong_limit_request)
async def change_password(
    request: Request,
    old_password: str,
    new_password: str,
    current_user: CurrentUser,
    session: SessionDependency,
) -> dict[str, str]:
    service = UserService(session)

    try:
        await service.change_password(current_user.id, old_password, new_password)
        logger.info(f"Password changed: user_id={current_user.id}")
        return {"detail": "Password changed successfully"}

    except EntityNotFoundError as e:
        logger.warning(
            f"Password change failed: invalid old password | user_id={current_user.id}"
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    except Exception as e:
        logger.error(
            f"Unexpected error in password change: user_id={current_user.id} | error={type(e).__name__}: {e}"
        )
        raise


@router.post("/activate", response_model=UserIsActive)
@limiter.limit(core_settings.strong_limit_request)
async def activate_user(
    request: Request,
    current_user: CurrentUser,
    session: SessionDependency,
) -> User | None:
    service = UserService(session)

    try:
        activated_user = await service.activate_user(current_user.id)
        logger.info(f"User activated: user_id={current_user.id}")
        return activated_user

    except EntityNotFoundError as e:
        logger.warning(
            f"User activation failed: user not found | user_id={current_user.id}"
        )
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/deactivate", response_model=UserIsActive)
@limiter.limit(core_settings.strong_limit_request)
async def deactivate_user(
    request: Request,
    current_user: CurrentUser,
    session: SessionDependency,
) -> User | None:
    service = UserService(session)

    try:
        deactivated_user = await service.deactivate_user(current_user.id)
        logger.info(f"User deactivated: user_id={current_user.id}")
        return deactivated_user

    except EntityNotFoundError as e:
        logger.warning(
            f"User deactivation failed: user not found | user_id={current_user.id}"
        )
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
