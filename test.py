# params = {"api_key": "b68d6619-77a9-481f-8164-89e9459c3043"}
# params2 = {"user_id": "1234567890"}

# params["api_key"] = "Really"
# params2["api_key"] = "Really"

# object = "hi"
# object_2 = None

# print(type(str(object)))
# print(type(str(object_2)))
# print(str(object))
# print(str(object_2) * 3)

# print(params)
# print(params2)
# import secrets

# sanitized = "HI"
# sanitized = sanitized + secrets.token_hex(2)

# print(sanitized)
#

# from app.core.core_settings import core_settings

# print(len(core_settings.session_secret_key))
#
from app.services.utils.crypto import crypto_manager

a = "eee1"
b: bytes = bytes(0b1110)

print(a, "\n", b)

a2 = crypto_manager.encrypt(a)
print(a2)
a3 = crypto_manager.encrypt(a)
print(a3)

a_decrypt = crypto_manager.decrypt(a2)
print(a_decrypt)
a_decrypt2 = crypto_manager.decrypt(a3)
print(a_decrypt2)
