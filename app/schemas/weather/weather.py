from pydantic import BaseModel, Field


class Coordinates(BaseModel):
    lat: float
    lon: float


class Wind(BaseModel):
    speed: float = Field(..., description="Скорость, м/с")
    deg: int = Field(..., description="Направление, градусы")
    gust: float | None = Field(None, description="Порывы, м/с")


class Precipitation(BaseModel):
    probability_pct: int = Field(0, ge=0, le=100, description="Вероятность осадков, %")
    rain_mm: float | None = Field(None, ge=0)
    snow_mm: float | None = Field(None, ge=0)
    type: str = Field("none", pattern="^(none|rain|snow)$")


class WeatherCondition(BaseModel):
    main: str
    description: str
    icon: str


class Location(BaseModel):
    name: str
    country: str
    timezone_offset: int
    population: int | None = None
    coordinates: Coordinates


class CurrentWeather(BaseModel):
    dt: int
    dt_iso: str
    dt_local: str
    temperature: float
    feels_like: float
    pressure_hpa: int
    humidity_pct: int
    clouds_pct: int
    visibility_m: int | None = None
    wind: Wind
    condition: WeatherCondition
    precipitation: Precipitation
    sunrise: int
    sunset: int
    is_day: bool


class WeatherNowResponse(BaseModel):
    location: Location
    current: CurrentWeather


class HourlyItem(BaseModel):
    dt: int
    dt_iso: str
    dt_local: str
    temperature: float
    feels_like: float
    pressure_hpa: int
    humidity_pct: int
    clouds_pct: int
    visibility_m: int | None = None
    wind: Wind
    condition: WeatherCondition
    precipitation: Precipitation
    is_day: bool


class DailySummary(BaseModel):
    date: str  # YYYY-MM-DD
    temp_min: float
    temp_max: float
    feels_like_min: float
    feels_like_max: float
    dominant_condition: WeatherCondition
    total_rain_mm: float
    total_snow_mm: float
    max_precipitation_probability_pct: int
    avg_wind_speed: float
    sunrise: int
    sunset: int


class Weather5DaysDetailedResponse(BaseModel):
    location: Location
    daily_summaries: list[DailySummary]
    hourly: list[HourlyItem]


class DailyShort(BaseModel):
    date: str
    temp_min: float
    temp_max: float
    feels_like_min: float
    feels_like_max: float
    condition: WeatherCondition
    precipitation_probability_pct: int
    rain_mm: float
    snow_mm: float
    wind_speed_avg: float
    wind_gust_max: float


class Weather5DaysSummaryResponse(BaseModel):
    location: Location
    days: list[DailyShort]
