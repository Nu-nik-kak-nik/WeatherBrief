from typing import Callable

from authlib.integrations.starlette_client import OAuth
from starlette.requests import Request

from app.core.core_settings import Provider, core_settings
from app.schemas.weather.auth_provider import UserOAuthInfo

oauth = OAuth()


def _setup_oauth_providers() -> None:

    if core_settings.google_client_id and core_settings.google_client_secret:
        oauth.register(
            name=Provider.GOOGLE.value,
            client_id=core_settings.google_client_id,
            client_secret=core_settings.google_client_secret,
            server_metadata_url="https://accounts.google.com/.well-known/openid_configuration",
            client_kwargs={"scope": "openid email profile"},
        )

    if core_settings.github_client_id and core_settings.github_client_secret:
        oauth.register(
            name=Provider.GITHUB.value,
            client_id=core_settings.github_client_id,
            client_secret=core_settings.github_client_secret,
            access_token_url="https://github.com/login/oauth/access_token",
            authorize_url="https://github.com/login/oauth/authorize",
            api_base_url="https://api.github.com/",
            client_kwargs={"scope": "user:email"},
        )


_setup_oauth_providers()


async def _fetch_google_user_info(token: dict) -> dict[str, str | None]:
    user_info = token.get("userinfo", {})

    if not user_info:
        raise RuntimeError("Failed to retrieve user info from Google.")

    return {
        "email": user_info.get("email"),
        "username": user_info.get("name"),
        "provider_id": str(user_info.get("sub")),
        "provider_email": user_info.get("email"),
        "provider_username": user_info.get("name"),
        "avatar_url": user_info.get("picture"),
        "access_token": token.get("access_token"),
        "refresh_token": token.get("refresh_token"),
        "token_expires_at": token.get("expires_at"),
        "provider": Provider.GOOGLE,
    }


async def _fetch_github_user_info(
    request: Request, token: dict
) -> dict[str, str | None]:
    user_info = {}

    try:
        resp = await oauth.github.get("user", token=token)
        resp.raise_for_status()
        user_info = resp.json()
    except Exception as e:
        raise RuntimeError(f"Failed to retrieve GitHub user info: {e}")

    email = user_info.get("email")
    if not email:
        try:
            resp = await oauth.github.get("user/emails", token=token)
            resp.raise_for_status()
            emails = resp.json()
            for e in emails:
                if e.get("primary") and e.get("verified"):
                    email = e.get("email")
                    break
        except Exception as e:
            email = None

    return {
        "email": email,
        "username": user_info.get("login"),
        "provider_id": str(user_info.get("id")),
        "provider_email": email,
        "provider_username": user_info.get("login"),
        "avatar_url": user_info.get("avatar_url"),
        "access_token": token.get("access_token"),
        "refresh_token": token.get("refresh_token"),
        "token_expires_at": token.get("expires_at"),
        "provider": Provider.GITHUB,
    }


FETCH_USER_INFO_MAP: dict[Provider, Callable] = {
    Provider.GOOGLE: _fetch_google_user_info,
    Provider.GITHUB: _fetch_github_user_info,
}

REDIRECT_URI_MAP: dict[Provider, str] = {
    Provider.GOOGLE: "oauth_google_callback",
    Provider.GITHUB: "oauth_github_callback",
}


async def get_oauth_user_info(provider: Provider, request: Request) -> UserOAuthInfo:
    handler = FETCH_USER_INFO_MAP.get(provider)
    if not handler:
        raise ValueError(f"Unsupported OAuth provider: {provider.value}")

    try:
        oauth_client = oauth.__getattr__(provider.value)
        token = await oauth_client.authorize_access_token(request)

    except Exception as e:
        raise RuntimeError(f"Failed to retrieve OAuth token from {provider.value}: {e}")

    raw_data = (
        await handler(request=request, token=token)
        if provider == Provider.GITHUB
        else await handler(token=token)
    )

    try:
        return UserOAuthInfo.model_validate(raw_data)

    except Exception as e:
        raise RuntimeError(f"Failed to validate OAuth data: {e}")


def get_redirect_uri(provider: Provider, request: Request) -> str:
    callback_name = REDIRECT_URI_MAP.get(provider)
    if not callback_name:
        raise ValueError(f"Unsupported OAuth provider: {provider.value}")

    return str(request.url_for(callback_name))
