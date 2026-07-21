class EntityNotFoundError(Exception):
    """Thrown when the entity is not found"""

    def __init__(self, message: str = "Entity not found"):
        self.message = message
        super().__init__(self.message)


class DuplicateEntityError(Exception):
    """Thrown when an entity with such unique fields already exists"""

    def __init__(self, message: str = "Entity already exists"):
        self.message = message
        super().__init__(self.message)


class PasswordValidationError(Exception):
    """Thrown when password does not meet security requirements"""

    def __init__(self, message: str = "Password does not meet security requirements"):
        self.message = message
        super().__init__(self.message)
