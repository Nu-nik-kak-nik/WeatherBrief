from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.core_settings import ApiService


class UserAPIKeyBase(BaseModel):
    user_id: str
    service: ApiService
    name_key: str | None = Field(None, max_length=100)
    plain_key: str


class UserAPIKeyCreate(UserAPIKeyBase):
    pass


class UserAPIKeyUpdate(BaseModel):
    name_key: str | None = None
    is_active: bool | None = None
    plain_key: str | None = None


class UserAPIKeyOut(BaseModel):
    id: str
    user_id: str
    service: ApiService
    name_key: str | None
    is_active: bool
    created_at: datetime
    last_four: str

    model_config = ConfigDict(from_attributes=True)


class UserAPIKeyWithPlainOut(UserAPIKeyOut):
    plain_key: str
