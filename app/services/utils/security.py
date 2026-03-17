from passlib.context import CryptContext

from app.core.core_settings import core_settings


class Hasher:
    def __init__(self):
        self.pwd_context = CryptContext(
            schemes=[core_settings.hash_algorithm],
            deprecated="auto",
        )

    def hash_value(self, plain_value: str) -> str:
        return self.pwd_context.hash(plain_value)

    def verify_value(self, plain_value: str, hashed_value: str) -> bool:
        return self.pwd_context.verify(plain_value, hashed_value)


hasher = Hasher()
