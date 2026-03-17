from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class WeatherSettings(BaseSettings):
    openweather_api_key: str | None = Field(
        default=None, validation_alias="OPENWEATHER_API_KEY"
    )

    base_url: str = "https://api.openweathermap.org"
    weather_endpoint: str = "/data/2.5/weather"
    forecast_endpoint: str = "/data/2.5/forecast"
    geocoding_endpoint: str = "/geo/1.0/direct"
    reverse_geocoding_endpoint: str = "/geo/1.0/reverse"

    default_city: str = "Красноярск"

    redis_url: str = "redis://localhost:6379"
    database_url: str = "sqlite+aiosqlite:///weather.db"

    cache_ttl_seconds: int = 1800
    weather_cache_ttl: int = 1200
    forecast_cache_ttl: int = 3600
    location_cache_ttl: int = 36000

    search_location_by_name_limit: int = 10
    search_location_by_coordinates_limit: int = 1

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


weather_settings = WeatherSettings()
