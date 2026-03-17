import hashlib
import json

import httpx
from fastapi import HTTPException

from app.core.cache import cache
from app.core.core_settings import core_settings
from app.core.logger import logger
from app.core.weather_settings import weather_settings


class OpenWeatherClient:
    def __init__(self):
        self.base_url = weather_settings.base_url
        self.timeout = core_settings.http_timeout
        self.client = httpx.AsyncClient(timeout=self.timeout)

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

    async def _generate_cache_key(self, endpoint: str, params: dict) -> str:
        cache_params = params.copy()
        cache_params.pop("appid", None)

        key_str = f"{endpoint}:{json.dumps(cache_params, sort_keys=True)}"
        return f"weather:{hashlib.sha256(key_str.encode()).hexdigest()}"

    async def _request_with_cache(
        self, endpoint: str, params: dict, cache_ttl: int
    ) -> dict:
        cache_key = await self._generate_cache_key(endpoint, params)

        cached_data = await cache.get(cache_key)
        if cached_data:
            return cached_data

        url = self.base_url + endpoint
        try:
            response = await self.client.get(url, params=params)
            if response.status_code == 401:
                logger.error(
                    f"OpenWeather API authentication failed: 401 | "
                    f"endpoint={endpoint} | params={ {k: v for k, v in params.items() if k != 'appid'} }"
                )
                raise HTTPException(401, "Invalid or missing OpenWeather API key")

            if response.status_code != 200:
                msg = response.json().get("message", "Unknown error")
                logger.error(
                    f"OpenWeather API error: {response.status_code} | "
                    f"endpoint={endpoint} | message={msg}"
                )
                raise HTTPException(response.status_code, f"OpenWeather: {msg}")

            result = response.json()

            await cache.set(cache_key, result, cache_ttl)

            return result

        except httpx.TimeoutException:
            logger.warning(
                f"OpenWeather API timeout: endpoint={endpoint} | "
                f"city={params.get('q', 'N/A')}"
            )
            raise HTTPException(504, "OpenWeather API timeout")

        except httpx.NetworkError as e:
            logger.error(
                f"OpenWeather network error: endpoint={endpoint} | error={str(e)}"
            )
            raise HTTPException(502, "OpenWeather network error")

        except Exception as e:
            logger.exception(
                f"Unexpected error in OpenWeather request: endpoint={endpoint} | error={type(e).__name__}: {e}"
            )
            raise

    async def get_weather(
        self,
        *,
        city: str | None = None,
        lat: float | None = None,
        lon: float | None = None,
        api_key: str | None = None,
        units: str = "metric",
        lang: str = "ru",
    ) -> dict:
        key = api_key or weather_settings.openweather_api_key

        if not key:
            logger.error("OpenWeather API key not configured (WEATHER_API_KEY missing)")
            raise HTTPException(
                400,
                "API key is required (set WEATHER_API_KEY in .env or pass ?api_key=...)",
            )

        params = {"appid": key, "units": units, "lang": lang}

        if city:
            params["q"] = city
        elif lat is not None and lon is not None:
            params["lat"] = str(lat)
            params["lon"] = str(lon)
        else:
            raise HTTPException(400, "Either city or lat/lon must be provided")

        return await self._request_with_cache(
            weather_settings.weather_endpoint,
            params,
            weather_settings.weather_cache_ttl,
        )

    async def get_forecast(
        self,
        *,
        city: str | None = None,
        lat: float | None = None,
        lon: float | None = None,
        api_key: str | None = None,
        units: str = "metric",
        lang: str = "ru",
    ) -> dict:
        key = api_key or weather_settings.openweather_api_key

        if not key:
            raise HTTPException(
                400,
                "API key is required (set WEATHER_API_KEY in .env or pass ?api_key=...)",
            )

        params = {"appid": key, "units": units, "lang": lang}

        if city:
            params["q"] = city
        elif lat is not None and lon is not None:
            params["lat"] = str(lat)
            params["lon"] = str(lon)
        else:
            raise HTTPException(400, "Either city or lat/lon must be provided")

        return await self._request_with_cache(
            weather_settings.forecast_endpoint,
            params,
            weather_settings.forecast_cache_ttl,
        )

    async def search_location_by_name(
        self,
        query: str,
        limit: int = weather_settings.search_location_by_name_limit,
        api_key: str | None = None,
    ) -> list[dict]:
        key = api_key or weather_settings.openweather_api_key
        if not key:
            raise HTTPException(
                400,
                "API key is required (set WEATHER_API_KEY in .env or pass ?api_key=...)",
            )

        params = {
            "q": query,
            "limit": limit,
            "appid": key,
        }

        result = await self._request_with_cache(
            weather_settings.geocoding_endpoint,
            params,
            weather_settings.location_cache_ttl,
        )

        if isinstance(result, list):
            return result
        else:
            raise HTTPException(500, "Unexpected response format from OpenWeather API")

    async def search_location_by_coordinates(
        self,
        lat: float,
        lon: float,
        limit: int = weather_settings.search_location_by_coordinates_limit,
        api_key: str | None = None,
    ) -> list[dict]:
        key = api_key or weather_settings.openweather_api_key
        if not key:
            raise HTTPException(
                400,
                "API key is required (set WEATHER_API_KEY in .env or pass ?api_key=...)",
            )

        params = {
            "lat": lat,
            "lon": lon,
            "limit": limit,
            "appid": key,
        }

        result = await self._request_with_cache(
            weather_settings.reverse_geocoding_endpoint,
            params,
            weather_settings.location_cache_ttl,
        )

        if isinstance(result, list):
            return result
        else:
            raise HTTPException(500, "Unexpected response format from OpenWeather API")


openweather_client = OpenWeatherClient()
