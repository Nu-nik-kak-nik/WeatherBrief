from datetime import datetime
from re import match
from uuid import uuid4

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    LargeBinary,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates
from sqlalchemy.types import JSON

from app.core.core_settings import ApiService, Metric, Provider, UserRole
from app.db.base_weather import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4()), index=True
    )
    email: Mapped[str | None] = mapped_column(
        String(255), unique=True, index=True, nullable=True
    )
    username: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole), default=UserRole.USER, index=True, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    default_units: Mapped[Metric] = mapped_column(
        Enum(Metric), default=Metric.METRIC, index=True, nullable=False
    )
    preferred_lang: Mapped[str] = mapped_column(
        String(10), default="ru", nullable=False
    )
    refresh_token: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    last_login_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    auth_providers: Mapped[list["AuthProvider"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", lazy="selectin"
    )
    save_locations: Mapped[list["SavedLocation"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="SavedLocation.display_order",
        lazy="selectin",
    )
    api_keys: Mapped[list["UserAPIKey"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", lazy="selectin"
    )

    __table_args__ = (
        Index("idx_user_email_active", "email", "is_active"),
        Index("idx_user_created", "created_at"),
        Index("idx_user_last_login", "last_login_at"),
        Index("idx_user_username_active", "username", "is_active"),
        Index("idx_user_role_active", "role", "is_active"),
        Index("idx_user_default_units", "default_units"),
        Index("idx_user_preferred_lang", "preferred_lang"),
    )

    @validates("email")
    def validate_email(self, key, value):
        if value and not match(r"[^@]+@[^@]+\.[^@]+", value):
            raise ValueError("Invalid email format")
        return value.lower() if value else value

    @validates("username")
    def validate_username(self, key, value):
        if value:
            if len(value) < 3:
                raise ValueError("Username must be at least 3 characters")
            if not match(r"^[a-zA-Z0-9_-]+$", value):
                raise ValueError(
                    "Username can only contain letters, numbers and underscores"
                )
        return value

    @property
    def has_password(self) -> bool:
        return bool(self.hashed_password)

    @property
    def display_name(self) -> str:
        return self.username or self.email.split("@")[0] if self.email else "Anonymous"

    @property
    def is_authenticated(self) -> bool:
        return self.is_active

    @property
    def identity(self) -> str:
        return self.id

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email})>"


class AuthProvider(Base):
    __tablename__ = "auth_providers"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    provider: Mapped[Provider] = mapped_column(
        Enum(Provider), index=True, nullable=False
    )
    provider_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    provider_email: Mapped[str | None] = mapped_column(String(255))
    provider_username: Mapped[str | None] = mapped_column(String(100))
    profile_data: Mapped[dict | None] = mapped_column(
        JSON(none_as_null=True), nullable=True
    )

    access_token: Mapped[bytes | None] = mapped_column(
        LargeBinary, nullable=True, index=False
    )
    refresh_token: Mapped[bytes | None] = mapped_column(
        LargeBinary, nullable=True, index=False
    )
    token_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    linked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    unlinked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )

    user: Mapped["User"] = relationship(back_populates="auth_providers", lazy="joined")

    __table_args__ = (
        UniqueConstraint("provider", "provider_id", name="uq_provider_id"),
        UniqueConstraint("provider", "provider_email", name="uq_provider_email"),
        UniqueConstraint("provider", "provider_username", name="uq_provider_username"),
        Index("idx_auth_user_provider", "user_id", "provider"),
        Index("idx_auth_provider_active", "provider", "unlinked_at"),
    )

    @property
    def is_active(self) -> bool:
        return self.unlinked_at is None

    @property
    def is_token_valid(self) -> bool:
        if not self.token_expires_at or not self.access_token:
            return False
        return datetime.now(self.token_expires_at.tzinfo) < self.token_expires_at

    def __repr__(self) -> str:
        return f"<AuthProvider(provider={self.provider}, user_id={self.user_id})>"


class UserAPIKey(Base):
    __tablename__ = "user_api_keys"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    service: Mapped[ApiService] = mapped_column(
        Enum(ApiService), nullable=False, default=ApiService.OPENWEATHER
    )
    name_key: Mapped[str | None] = mapped_column(String(100), nullable=True)
    encrypted_key: Mapped[bytes] = mapped_column(LargeBinary)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    last_four: Mapped[str] = mapped_column(
        String(4),
        nullable=False,
    )

    user: Mapped["User"] = relationship(back_populates="api_keys", lazy="joined")

    __table_args__ = (
        UniqueConstraint("user_id", "service", name="uq_user_service"),
        Index("idx_user_service", "user_id", "service", "is_active"),
    )

    @property
    def display_name(self) -> str:
        if self.name_key:
            return self.name_key
        return f"****{self.last_four}"

    def __repr__(self) -> str:
        return f"<UserAPIKey(id={self.id}, user={self.user_id}, hashed_api_key={self.encrypted_key})>"


class SavedLocation(Base):
    __tablename__ = "saved_locations"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4()), index=True
    )
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    location_name: Mapped[str | None] = mapped_column(
        String(255), index=True, nullable=True
    )
    country: Mapped[str] = mapped_column(String(100), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    timezone_offset: Mapped[int] = mapped_column(Integer, nullable=False)
    custom_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    note: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    display_order: Mapped[int] = mapped_column(Integer, default=0)

    user: Mapped["User"] = relationship(back_populates="save_locations", lazy="joined")

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "location_name",
            "country",
            name="uq_user_location_name",
        ),
        UniqueConstraint(
            "user_id", "latitude", "longitude", name="uq_user_coordinates"
        ),
        Index("idx_location_user", "user_id", "created_at"),
        Index("idx_location_coords", "latitude", "longitude"),
        Index("idx_location_name_country", "location_name", "country"),
        Index("idx_location_order", "user_id", "display_order"),
    )

    @validates("latitude")
    def validate_latitude(self, key, value):
        if not -90 <= value <= 90:
            raise ValueError("Latitude must be between -90 and 90")
        return round(value, 6)

    @validates("longitude")
    def validate_longitude(self, key, value):
        if not -180 <= value <= 180:
            raise ValueError("Longitude must be between -180 and 180")
        return round(value, 6)

    @property
    def full_name(self) -> str:
        parts = []
        if self.custom_name:
            parts.append(self.custom_name)
        if self.location_name:
            parts.append(self.location_name)
        if self.country:
            parts.append(self.country)
        return ", ".join(parts)

    @property
    def coordinates(self) -> dict:
        return {"lat": self.latitude, "lon": self.longitude}

    def __repr__(self) -> str:
        return f"<SavedLocation(id={self.id}, name={self.location_name}, user={self.user_id})>"
