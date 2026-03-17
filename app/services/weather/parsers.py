from datetime import datetime, timezone
from typing import Any

from app.schemas.weather.weather import (
    Coordinates,
    CurrentWeather,
    DailyShort,
    DailySummary,
    HourlyItem,
    Location,
    Precipitation,
    Weather5DaysDetailedResponse,
    Weather5DaysSummaryResponse,
    WeatherCondition,
    WeatherNowResponse,
    Wind,
)


def _dt_to_iso(dt: int) -> str:
    return datetime.fromtimestamp(dt, tz=timezone.utc).isoformat()


def _dt_to_local_iso(dt: int, tz_offset: int) -> str:
    local_dt = datetime.fromtimestamp(dt + tz_offset, tz=timezone.utc)
    sign = "+" if tz_offset >= 0 else "-"
    hours = abs(tz_offset) // 3600
    minutes = (abs(tz_offset) % 3600) // 60
    tz_str = f"{sign}{hours:02d}:{minutes:02d}"
    return local_dt.isoformat().replace("+00:00", tz_str)


def _is_day_from_icon(icon: str) -> bool:
    return icon.endswith("d")


def _get_precipitation(item: dict[str, Any]) -> Precipitation:
    pop = item.get("pop", 0)
    rain = item.get("rain", {}).get("3h")
    snow = item.get("snow", {}).get("3h")
    p_type = "none"
    if rain and rain > 0:
        p_type = "rain"
    elif snow and snow > 0:
        p_type = "snow"
    return Precipitation(
        probability_pct=round(pop * 100), rain_mm=rain, snow_mm=snow, type=p_type
    )


def parse_current(data: dict[str, Any]) -> WeatherNowResponse:
    tz = data["timezone"]
    dt = data["dt"]
    w0 = data["weather"][0]

    return WeatherNowResponse(
        location=Location(
            name=data["name"],
            country=data["sys"]["country"],
            timezone_offset=tz,
            population=None,
            coordinates=Coordinates(lat=data["coord"]["lat"], lon=data["coord"]["lon"]),
        ),
        current=CurrentWeather(
            dt=dt,
            dt_iso=_dt_to_iso(dt),
            dt_local=_dt_to_local_iso(dt, tz),
            temperature=data["main"]["temp"],
            feels_like=data["main"]["feels_like"],
            pressure_hpa=data["main"]["pressure"],
            humidity_pct=data["main"]["humidity"],
            clouds_pct=data["clouds"]["all"],
            visibility_m=data.get("visibility"),
            wind=Wind(
                speed=data["wind"]["speed"],
                deg=data["wind"]["deg"],
                gust=data["wind"].get("gust"),
            ),
            condition=WeatherCondition(
                main=w0["main"], description=w0["description"], icon=w0["icon"]
            ),
            precipitation=_get_precipitation(data),
            sunrise=data["sys"]["sunrise"],
            sunset=data["sys"]["sunset"],
            is_day=_is_day_from_icon(w0["icon"]),
        ),
    )


def parse_forecast(data: dict[str, Any]) -> Weather5DaysDetailedResponse:
    tz = data["city"]["timezone"]
    city = data["city"]

    hourly_items: list[HourlyItem] = []
    for item in data["list"]:
        w0 = item["weather"][0]
        dt = item["dt"]
        hourly_items.append(
            HourlyItem(
                dt=dt,
                dt_iso=_dt_to_iso(dt),
                dt_local=_dt_to_local_iso(dt, tz),
                temperature=item["main"]["temp"],
                feels_like=item["main"]["feels_like"],
                pressure_hpa=item["main"]["pressure"],
                humidity_pct=item["main"]["humidity"],
                clouds_pct=item["clouds"]["all"],
                visibility_m=item.get("visibility"),
                wind=Wind(
                    speed=item["wind"]["speed"],
                    deg=item["wind"]["deg"],
                    gust=item["wind"].get("gust"),
                ),
                condition=WeatherCondition(
                    main=w0["main"], description=w0["description"], icon=w0["icon"]
                ),
                precipitation=_get_precipitation(item),
                is_day=_is_day_from_icon(w0["icon"]),
            )
        )

    from collections import defaultdict

    days = defaultdict(list)
    for h in hourly_items:
        date_key = h.dt_local.split("T")[0]
        days[date_key].append(h)

    daily_summaries = []
    for date_str, hours in sorted(days.items()):
        temps = [h.temperature for h in hours]
        feels = [h.feels_like for h in hours]
        rains = [h.precipitation.rain_mm or 0 for h in hours]
        snows = [h.precipitation.snow_mm or 0 for h in hours]
        probs = [h.precipitation.probability_pct for h in hours]
        wind_speeds = [h.wind.speed for h in hours]

        conditions = [h.condition.main for h in hours]
        dominant_main = max(set(conditions), key=conditions.count)
        dominant_desc = next(
            h.condition.description for h in hours if h.condition.main == dominant_main
        )
        dominant_icon = next(
            h.condition.icon for h in hours if h.condition.main == dominant_main
        )

        daily_summaries.append(
            DailySummary(
                date=date_str,
                temp_min=min(temps),
                temp_max=max(temps),
                feels_like_min=min(feels),
                feels_like_max=max(feels),
                dominant_condition=WeatherCondition(
                    main=dominant_main, description=dominant_desc, icon=dominant_icon
                ),
                total_rain_mm=sum(rains),
                total_snow_mm=sum(snows),
                max_precipitation_probability_pct=max(probs),
                avg_wind_speed=round(sum(wind_speeds) / len(wind_speeds), 1),
                sunrise=city["sunrise"],
                sunset=city["sunset"],
            )
        )

    return Weather5DaysDetailedResponse(
        location=Location(
            name=city["name"],
            country=city["country"],
            timezone_offset=tz,
            population=city.get("population"),
            coordinates=Coordinates(lat=city["coord"]["lat"], lon=city["coord"]["lon"]),
        ),
        daily_summaries=daily_summaries[:5],
        hourly=hourly_items,
    )


def to_short_response(
    detailed: Weather5DaysDetailedResponse,
) -> Weather5DaysSummaryResponse:
    days_short = []
    for d in detailed.daily_summaries:
        day_hours = [h for h in detailed.hourly if h.dt_local.startswith(d.date)]
        wind_speeds = [h.wind.speed for h in day_hours]
        wind_gusts = [h.wind.gust for h in day_hours if h.wind.gust is not None]

        days_short.append(
            DailyShort(
                date=d.date,
                temp_min=d.temp_min,
                temp_max=d.temp_max,
                feels_like_min=d.feels_like_min,
                feels_like_max=d.feels_like_max,
                condition=d.dominant_condition,
                precipitation_probability_pct=d.max_precipitation_probability_pct,
                rain_mm=d.total_rain_mm,
                snow_mm=d.total_snow_mm,
                wind_speed_avg=round(sum(wind_speeds) / len(wind_speeds), 1)
                if wind_speeds
                else 0,
                wind_gust_max=max(wind_gusts) if wind_gusts else 0,
            )
        )

    return Weather5DaysSummaryResponse(location=detailed.location, days=days_short[:5])
