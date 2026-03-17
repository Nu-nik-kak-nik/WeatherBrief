import json
from typing import Any

import redis.asyncio as redis

from app.core.weather_settings import weather_settings


class RedisCache:
    def __init__(self):
        self.redis_client: redis.Redis | None = None

    async def connect(self):
        """Connecting to Redis"""
        self.redis_client = redis.from_url(
            weather_settings.redis_url, encoding="utf-8", decode_responses=True
        )

    async def disconnect(self):
        """Disconnecting from Redis"""
        if self.redis_client:
            await self.redis_client.close()

    async def get(self, key: str) -> Any | None:
        """Retrieving data from Redis"""
        if not self.redis_client:
            return None

        data = await self.redis_client.get(key)
        if data:
            return json.loads(data)
        return None

    async def set(self, key: str, value: Any, ttl: int | None = None):
        """Storing data in Redis"""
        if not self.redis_client:
            return

        serialized = json.dumps(value)
        if ttl:
            await self.redis_client.setex(key, ttl, serialized)
        else:
            await self.redis_client.set(key, serialized)

    async def delete(self, key: str):
        """Removing data from Redis"""
        if self.redis_client:
            await self.redis_client.delete(key)


cache = RedisCache()
