from cryptography.fernet import Fernet

from app.core.core_settings import core_settings


class CryptoManager:
    def __init__(self, encryption_key: bytes):
        self.cipher = Fernet(encryption_key)

    def encrypt(self, plain_text: str) -> bytes:
        return self.cipher.encrypt(plain_text.encode())

    def decrypt(self, encrypted_text: bytes) -> str:
        return self.cipher.decrypt(encrypted_text).decode()


crypto_manager = CryptoManager(encryption_key=core_settings.fernet_encryption_key)
