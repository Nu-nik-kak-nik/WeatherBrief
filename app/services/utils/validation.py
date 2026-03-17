from typing import Any

from fastapi import Depends, HTTPException, status

from app.core.auth import get_current_user_option
from app.core.core_settings import ApiService, core_settings
from app.core.weather_settings import weather_settings
from app.db.session_weather import SessionDependency, get_session
from app.models.weather import User
from app.services.db_services.api_key_services import APIKeyService
from app.services.weather.params import get_validated_weather_params


def ensure_exists(
    value: Any | None, error_message: str, status_code: int = status.HTTP_404_NOT_FOUND
) -> Any:
    if not value:
        raise HTTPException(status_code=status_code, detail=error_message)
    return value


def ensure_user_access(user_id: str, current_user_id: Any):
    if user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=core_settings.access_denied_message,
        )


def ensure_is_active(entity: Any, field_name: str = "entity"):
    if hasattr(entity, "is_active") and not entity.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} is not active",
        )


async def inject_api_key_from_user(
    params: dict[str, Any] = Depends(get_validated_weather_params),
    current_user: User | None = Depends(get_current_user_option),
    session: SessionDependency | None = Depends(get_session),
) -> dict[str, Any]:
    if current_user and session:
        api_key_service = APIKeyService(session)
        api_key = await api_key_service.get_active_api_key_by_user_and_service(
            current_user.id, ApiService.OPENWEATHER
        )
        if api_key:
            params["api_key"] = await api_key_service.get_decrypted_api_key(api_key.id)
    else:
        params["api_key"] = weather_settings.openweather_api_key

    return params


async def get_api_key(
    current_user: User | None = Depends(get_current_user_option),
    session: SessionDependency | None = Depends(get_session),
) -> str | None:
    if current_user and session:
        api_key_service = APIKeyService(session)
        api_key = await api_key_service.get_active_api_key_by_user_and_service(
            current_user.id, ApiService.OPENWEATHER
        )
        if api_key:
            return await api_key_service.get_decrypted_api_key(api_key.id)

    return weather_settings.openweather_api_key
