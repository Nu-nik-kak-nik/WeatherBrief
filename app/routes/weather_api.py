from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.logger import logger
from app.schemas.weather.location_search import (
    LocationSearchResponse,
    LocationSearchResult,
)
from app.schemas.weather.weather import (
    Weather5DaysDetailedResponse,
    Weather5DaysSummaryResponse,
    WeatherNowResponse,
)
from app.services.utils.validation import get_api_key
from app.services.weather.clients import openweather_client
from app.services.weather.params import (
    get_validated_location_search_params,
    get_validated_reverse_search_params,
    get_validated_weather_params,
)
from app.services.weather.parsers import (
    parse_current,
    parse_forecast,
    to_short_response,
)

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(
    prefix="/weather",
    tags=["Weather"],
    responses={404: {"description": "Not found"}},
)


@router.get("/now", response_model=WeatherNowResponse)
@limiter.limit("30/minute")
async def get_weather_now(
    request: Request,
    params: dict[str, Any] = Depends(get_validated_weather_params),
    api_key: str = Depends(get_api_key),
) -> WeatherNowResponse:
    params["api_key"] = api_key
    try:
        data = await openweather_client.get_weather(**params)

    except HTTPException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    return parse_current(data)


@router.get("/5days/detailed", response_model=Weather5DaysDetailedResponse)
@limiter.limit("20/minute")
async def get_weather_5days_detailed(
    request: Request,
    params: dict[str, Any] = Depends(get_validated_weather_params),
    api_key: str = Depends(get_api_key),
) -> Weather5DaysDetailedResponse:
    params["api_key"] = api_key
    try:
        data = await openweather_client.get_forecast(**params)

    except HTTPException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    return parse_forecast(data)


@router.get("/5days/summary", response_model=Weather5DaysSummaryResponse)
@limiter.limit("30/minute")
async def get_weather_5days_summary(
    request: Request,
    params: dict[str, Any] = Depends(get_validated_weather_params),
    api_key: str = Depends(get_api_key),
) -> Weather5DaysSummaryResponse:
    params["api_key"] = api_key
    try:
        data = await openweather_client.get_forecast(**params)

    except HTTPException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    detailed = parse_forecast(data)
    return to_short_response(detailed)


@router.get("/search/by-name", response_model=LocationSearchResponse)
@limiter.limit("20/minute")
async def search_locations_by_name(
    request: Request,
    params: dict[str, Any] = Depends(get_validated_location_search_params),
    api_key: str = Depends(get_api_key),
) -> LocationSearchResponse:

    try:
        results = await openweather_client.search_location_by_name(
            query=params["query"],
            limit=params["limit"],
            api_key=api_key,
        )
    except HTTPException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    if not results:
        logger.warning(f"Location search returned 0 results: query='{params['query']}'")

    return LocationSearchResponse(
        results=[LocationSearchResult(**item) for item in results]
    )


@router.get("/search/by-coords", response_model=LocationSearchResponse)
@limiter.limit("20/minute")
async def search_locations_by_coordinates(
    request: Request,
    params: dict[str, Any] = Depends(get_validated_reverse_search_params),
    api_key: str = Depends(get_api_key),
) -> LocationSearchResponse:

    try:
        results = await openweather_client.search_location_by_coordinates(
            lat=params["lat"],
            lon=params["lon"],
            limit=params["limit"],
            api_key=api_key,
        )
    except HTTPException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    if not results:
        logger.warning(
            f"Reverse geocoding returned 0 results: coords=({params['lat']}, {params['lon']})"
        )

    return LocationSearchResponse(
        results=[LocationSearchResult(**item) for item in results]
    )
