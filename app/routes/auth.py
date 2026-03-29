from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.auth import (
    create_access_token,
    create_refresh_token,
    get_current_user,
    get_user_by_refresh_token,
)
from app.core.core_settings import Provider, core_settings
from app.core.exceptions import DuplicateEntityError, EntityNotFoundError
from app.core.logger import logger
from app.core.oauth import get_oauth_user_info, get_redirect_uri, oauth
from app.db.session_weather import SessionDependency
from app.models.weather import User
from app.schemas.weather.auth_endpoint import (
    LogoutResponse,
    UserTokenIn,
    UserTokenOut,
)
from app.schemas.weather.user import UserCreate, UserProfile
from app.services.db_services.user_service import UserService
from app.services.utils.validation import ensure_exists

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
@limiter.limit(core_settings.strong_limit_request)
async def register_user(
    request: Request, user_data: UserCreate, session: SessionDependency
) -> dict[str, str]:

    service = UserService(session)
    try:
        user = await service.register_user(user_data)

    except DuplicateEntityError as e:
        logger.warning(
            f"Registration failed: email already exists | email={user_data.email}"
        )
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    logger.info(f"New user registered: user_id={user.id} | email={user.email}")
    return {"user_id": user.id}


@router.post("/login", response_model=UserTokenOut)
@limiter.limit(core_settings.strong_limit_request)
async def login_user(
    request: Request,
    response: Response,
    user_data: UserTokenIn,
    session: SessionDependency,
) -> UserTokenOut:

    service = UserService(session)
    try:
        user = await service.authenticate_user(user_data.email, user_data.password)

    except EntityNotFoundError as e:
        logger.warning(f"Login failed: user not found | email={user_data.email}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    user = ensure_exists(user, core_settings.auth_credentials_error_message)

    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})

    try:
        await service.update_refresh_token(user.id, refresh_token)

    except EntityNotFoundError as e:
        logger.error(
            f"Login failed: could not update refresh token | user_id={user.id}"
        )
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    response.set_cookie(
        key=core_settings.refresh_token_cookie_name,
        value=refresh_token,
        path=core_settings.refresh_token_cookie_path,
        domain=core_settings.session_cookie_domain,
        httponly=core_settings.session_cookie_httponly,
        secure=core_settings.session_cookie_secure,
        samesite=core_settings.session_cookie_samesite,
        max_age=core_settings.refresh_token_cookie_max_age,
    )

    logger.info(f"User logged in: user_id={user.id} | email={user.email}")
    return UserTokenOut(
        access_token=access_token,
        refresh_token=None,
        token_type="bearer",
    )


@router.post("/refresh", response_model=UserTokenOut)
@limiter.limit(core_settings.average_limit_request)
async def refresh_token_endpoint(
    request: Request, response: Response, session: SessionDependency
) -> UserTokenOut:

    refresh_token = request.cookies.get(core_settings.refresh_token_cookie_name)

    if not refresh_token:
        logger.warning("Token refresh failed: missing refresh token in cookies")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing refresh token",
        )

    try:
        user = await get_user_by_refresh_token(refresh_token, session)

    except Exception as e:
        logger.warning(
            f"Token refresh failed: invalid or expired token | error={type(e).__name__}"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=core_settings.token_error_message,
        )

    user = ensure_exists(
        user, core_settings.token_error_message, status.HTTP_401_UNAUTHORIZED
    )

    new_access_token = create_access_token(data={"sub": user.id})
    new_refresh_token = create_refresh_token(data={"sub": user.id})

    service = UserService(session)
    await service.update_refresh_token(user.id, new_refresh_token)

    response.set_cookie(
        key=core_settings.refresh_token_cookie_name,
        value=new_refresh_token,
        path=core_settings.refresh_token_cookie_path,
        domain=core_settings.session_cookie_domain,
        httponly=core_settings.session_cookie_httponly,
        secure=core_settings.session_cookie_secure,
        samesite=core_settings.session_cookie_samesite,
        max_age=core_settings.refresh_token_cookie_max_age,
    )

    logger.debug(f"Token refreshed: user_id={user.id}")
    return UserTokenOut(
        access_token=new_access_token,
        refresh_token=None,
        token_type="bearer",
    )


@router.get("/oauth/github/login")
@limiter.limit(core_settings.strong_limit_request)
async def oauth_github_login(request: Request):
    redirect_uri = get_redirect_uri(Provider.GITHUB, request)
    logger.debug(f"OAuth GitHub login initiated: redirect_uri={redirect_uri}")
    return await oauth.github.authorize_redirect(request, redirect_uri)


@router.get("/oauth/github/callback", response_model=UserTokenOut)
@limiter.limit(core_settings.strong_limit_request)
async def oauth_github_callback(
    request: Request,
    response: Response,
    session: SessionDependency,
) -> RedirectResponse:
    code = request.query_params.get("code")

    if not code:
        error = request.query_params.get("error")
        logger.warning(
            f"OAuth GitHub callback failed: no code received | error={error}"
        )
        redirect_url = (
            f"{core_settings.frontend_oauth_callback_url}?error={error or 'no_code'}"
        )
        return RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)

    try:
        auth_info = await get_oauth_user_info(Provider.GITHUB, request)
    except Exception as e:
        logger.error(
            f"OAuth GitHub callback failed: could not fetch user info | error={type(e).__name__}: {e}"
        )
        redirect_url = f"{core_settings.frontend_oauth_callback_url}?error=fetch_failed"
        return RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)

    if not auth_info.email:
        logger.warning("OAuth GitHub callback failed: email not available from GitHub")
        redirect_url = (
            f"{core_settings.frontend_oauth_callback_url}?error=email_not_available"
        )
        return RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)

    service = UserService(session)

    try:
        user, is_new = await service.get_or_create_from_oauth(auth_info)

    except DuplicateEntityError as e:
        logger.warning(
            f"OAuth GitHub callback failed: email already exists with different provider | email={auth_info.email}"
        )
        redirect_url = f"{core_settings.frontend_oauth_callback_url}?error=email_exists"
        return RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    await service.update_refresh_token(user.id, refresh_token)

    response.set_cookie(
        key=core_settings.refresh_token_cookie_name,
        value=refresh_token,
        path=core_settings.refresh_token_cookie_path,
        domain=core_settings.session_cookie_domain,
        httponly=core_settings.session_cookie_httponly,
        secure=core_settings.session_cookie_secure,
        samesite=core_settings.session_cookie_samesite,
        max_age=core_settings.refresh_token_cookie_max_age,
    )

    logger.info(
        f"OAuth login successful: user_id={user.id} | provider=github | new_user={is_new}"
    )
    redirect_url = (
        f"{core_settings.frontend_oauth_callback_url}?access_token={access_token}"
    )
    return RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)


@router.get("/me", response_model=UserProfile)
@limiter.limit(core_settings.average_limit_request)
async def get_profile(
    request: Request, current_user: User = Depends(get_current_user)
) -> UserProfile:
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        role=current_user.role,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        is_superuser=current_user.is_superuser,
        default_units=current_user.default_units,
        preferred_lang=current_user.preferred_lang,
        created_at=current_user.created_at,
        last_login_at=current_user.last_login_at,
        updated_at=current_user.updated_at,
    )


@router.post("/logout", response_model=LogoutResponse, status_code=status.HTTP_200_OK)
@limiter.limit(core_settings.average_limit_request)
async def logout_user(
    request: Request,
    response: Response,
    session: SessionDependency,
    current_user: User = Depends(get_current_user),
) -> LogoutResponse:
    service = UserService(session)
    await service.update_refresh_token(current_user.id, "")
    request.session.clear()

    response.delete_cookie(
        key=core_settings.session_cookie_name,
        path=core_settings.session_cookie_path,
        domain=core_settings.session_cookie_domain,
        secure=core_settings.session_cookie_secure,
        httponly=core_settings.session_cookie_httponly,
        samesite=core_settings.session_cookie_samesite,
    )
    response.delete_cookie(
        key=core_settings.refresh_token_cookie_name,
        path=core_settings.refresh_token_cookie_path,
        domain=core_settings.session_cookie_domain,
        secure=core_settings.session_cookie_secure,
        httponly=core_settings.session_cookie_httponly,
        samesite=core_settings.session_cookie_samesite,
    )

    logger.info(f"User logged out: user_id={current_user.id}")
    return LogoutResponse(message="Successfully logged out")
