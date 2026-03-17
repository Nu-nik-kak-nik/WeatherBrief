from pydantic import BaseModel, ConfigDict


class LocationSearchResult(BaseModel):
    name: str
    lat: float
    lon: float
    country: str
    state: str | None = None

    model_config = ConfigDict(
        from_attributes=True,
        extra="ignore",
    )


class LocationSearchResponse(BaseModel):
    results: list[LocationSearchResult]
