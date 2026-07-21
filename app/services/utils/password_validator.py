import re
from typing import Tuple


def validate_password_strength(password: str) -> Tuple[bool, str]:
    if len(password) < 6:
        return False, "Password must contain at least 6 characters"

    if not re.search(r"[A-Z]", password):
        return False, "The password must contain at least one capital Latin letter."

    if not re.search(r"[a-z]", password):
        return False, "The password must contain at least one lowercase Latin letter."

    # if not re.search(r"\d", password):
    #     return False, "The password must contain at least one number."

    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return (
            False,
            "The password must contain at least one special character (!@#$%^&*)",
        )

    return True, ""
