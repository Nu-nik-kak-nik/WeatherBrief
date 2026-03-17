from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class SavedLocationBase(BaseModel):
    user_id: str
    location_name: str | None = Field(None, max_length=255)
    country: str = Field(max_length=100)
    latitude: float
    longitude: float
    timezone_offset: int
    custom_name: str | None = Field(None, max_length=255)
    note: str | None = Field(None, max_length=500)
    display_order: int = 0

    @field_validator("latitude", mode="before")
    @classmethod
    def validate_latitude(cls, v):
        if not -90 <= v <= 90:
            raise ValueError("Latitude must be between -90 and 90")
        return round(float(v), 6)

    @field_validator("longitude", mode="before")
    @classmethod
    def validate_longitude(cls, v):
        if not -180 <= v <= 180:
            raise ValueError("Longitude must be between -180 and 180")
        return round(float(v), 6)


class SavedLocationCreate(SavedLocationBase):
    pass


class SavedLocationUpdate(BaseModel):
    location_name: str | None = Field(None, max_length=255)
    custom_name: str | None = Field(None, max_length=255)
    note: str | None = Field(None, max_length=500)
    country: str | None = Field(None, max_length=100)
    display_order: int | None = None


class SavedLocationOut(BaseModel):
    id: str
    user_id: str
    location_name: str | None
    country: str
    latitude: float
    longitude: float
    timezone_offset: int
    custom_name: str | None
    note: str | None
    created_at: datetime
    display_order: int

    model_config = ConfigDict(from_attributes=True)


class ReorderLocationsRequest(BaseModel):
    location_ids: list[str]

    model_config = ConfigDict(from_attributes=True)
