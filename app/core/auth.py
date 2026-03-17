from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWTError

from app.core.core_settings import core_settings
from app.db.session_weather import SessionDependency
from app.models.weather import User
from app.services.db_services.user_service import UserService

security = HTTPBearer()


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=core_settings.token_minutes_length)
    )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, core_settings.secret_key, algorithm=core_settings.algorithm
    )
    return encoded_jwt


def verify_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(
            token, core_settings.secret_key, algorithms=[core_settings.algorithm]
        )
        return payload
    except PyJWTError:
        return None


async def get_current_user_option(
    session: SessionDependency,
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False)),
) -> User | None:
    if not credentials:
        return None

    try:
        payload = verify_token(credentials.credentials)
        if payload is None:
            return None
        user_id: str | None = payload.get("sub")
        if user_id is None:
            return None

        service = UserService(session)
        user = await service.get_user_by_id(user_id)
        if user is None or not user.is_active:
            return None

        return user
    except Exception:
        return None


async def get_current_user(
    session: SessionDependency,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = verify_token(credentials.credentials)
    if payload is None:
        raise credentials_exception

    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    service = UserService(session)
    user = await service.get_user_by_id(user_id)
    if user is None or not user.is_active:
        raise credentials_exception

    return user


def create_refresh_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(days=core_settings.token_days_length)
    )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, core_settings.secret_key, algorithm=core_settings.algorithm
    )
    return encoded_jwt


async def get_user_by_refresh_token(
    token: str, session: SessionDependency
) -> User | None:
    payload = verify_token(token)
    if payload is None:
        return None
    user_id: str | None = payload.get("sub")
    if user_id is None:
        return None
    service = UserService(session)
    user = await service.get_user_by_id(user_id)
    if user is None or user.refresh_token != token:
        return None
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
