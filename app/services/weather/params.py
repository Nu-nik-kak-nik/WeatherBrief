from fastapi import HTTPException, Query

from app.core.weather_settings import weather_settings


def get_validated_weather_params(
    city: str | None = Query(
        default=None, min_length=2, max_length=200, example="Moscow"
    ),
    lat: float | None = Query(default=None, ge=-90, le=90, example=55.7558),
    lon: float | None = Query(default=None, ge=-180, le=180, example=37.6173),
    units: str = Query(
        default="metric",
        regex="^(metric|imperial|kelvin)$",
        examples=["metric", "imperial"],
    ),
    lang: str = Query(default="ru", regex=r"^[a-z]{2}$", examples=["ru", "en", "de"]),
) -> dict[str, str | float | int | str | None]:
    if not city and (lat is None or lon is None):
        raise HTTPException(
            status_code=400,
            detail={
                "error": "missing_location",
                "message": "Specify either 'city' or both 'lat' and 'lon' parameters",
                "hint": "Example: ?city=Moscow or ?lat=55.7558&lon=37.6173",
            },
        )

    return {
        "city": city,
        "lat": lat,
        "lon": lon,
        "units": units,
        "lang": lang,
    }


def get_validated_location_search_params(
    query: str = Query(
        ..., description="Name of the location", min_length=1, max_length=100
    ),
    limit: int = Query(weather_settings.search_location_by_name_limit, ge=1, le=10),
    lang: str = Query(default="ru", regex=r"^[a-z]{2}$", examples=["ru", "en", "de"]),
) -> dict[str, str | int | str | None]:
    return {"query": query, "limit": limit, "lang": lang}


def get_validated_reverse_search_params(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    limit: int = Query(1, ge=1, le=5),
    lang: str = Query(default="ru", regex=r"^[a-z]{2}$", examples=["ru", "en", "de"]),
) -> dict[str, float | int | str | None]:
    return {"lat": lat, "lon": lon, "limit": limit, "lang": lang}
