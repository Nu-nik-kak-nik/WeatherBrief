from pydantic import BaseModel, ConfigDict, Field


class UserTokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

    model_config = ConfigDict(from_attributes=True)


class UserTokenOutRefresh(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"

    model_config = ConfigDict(from_attributes=True)


class UserTokenIn(BaseModel):
    email: str
    password: str

    model_config = ConfigDict(from_attributes=True)


class UserIdOut(BaseModel):
    id: str

    model_config = ConfigDict(from_attributes=True)


class MessageResponse(BaseModel):
    message: str = Field(...)
    status: str = Field(default="success")


class LogoutResponse(MessageResponse):
    pass
