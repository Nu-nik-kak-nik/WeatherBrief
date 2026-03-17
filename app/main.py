from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from starlette.middleware.sessions import SessionMiddleware

from app.core.cache import cache
from app.core.core_settings import core_settings
from app.core.logger import logger
from app.core.weather_settings import weather_settings
from app.routes import api_keys, auth, auth_providers, location, users, weather_api

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=weather_settings.redis_url,
    default_limits=["100/minute"],
)


def rate_limit_exception_handler(request: Request, exc: Exception) -> Response:
    if isinstance(exc, RateLimitExceeded):
        return _rate_limit_exceeded_handler(request, exc)
    raise exc


@asynccontextmanager
async def lifespan(app: FastAPI):
    await cache.connect()

    logger.info(
        f"Application starting: {core_settings.app_name} v{core_settings.version} | "
        f"host={core_settings.app_host}:{core_settings.app_port} | "
        f"log_level={core_settings.log_level}"
    )

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, rate_limit_exception_handler)

    yield

    logger.info("Application stopped")
    await cache.disconnect()


app = FastAPI(
    lifespan=lifespan,
    title=core_settings.title,
    description=core_settings.description,
    version=core_settings.version,
    docs_url=core_settings.docs_url,
)

app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    SessionMiddleware,
    secret_key=core_settings.session_secret_key,
    https_only=core_settings.session_cookie_secure,
    same_site=core_settings.session_cookie_samesite,
    max_age=core_settings.session_max_age,
    path=core_settings.session_cookie_path,
    domain=core_settings.session_cookie_domain,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=core_settings.allowed_origins,
    allow_credentials=core_settings.allow_credentials,
    allow_methods=core_settings.allow_methods,
    allow_headers=core_settings.allow_headers,
)

app.include_router(weather_api.router)
app.include_router(auth.router)
app.include_router(location.router)
app.include_router(api_keys.router)
app.include_router(users.router)
app.include_router(auth_providers.router)


@app.get("/")
async def root():
    return {"service": "Weather Brief", "status": "ok", "docs": "/docs"}


if __name__ == "__main__":
    uvicorn.run(
        core_settings.app_module,
        host=core_settings.app_host,
        port=core_settings.app_port,
        reload=core_settings.app_reload,
    )
