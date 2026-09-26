class AppException(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class NotFoundError(AppException):
    def __init__(self, message: str = "Resource not found", code: str = "NOT_FOUND"):
        super().__init__(code=code, message=message, status_code=404)


class ValidationConflictError(AppException):
    def __init__(self, message: str = "Validation conflict", code: str = "CONFLICT"):
        super().__init__(code=code, message=message, status_code=409)


class BadRequestError(AppException):
    def __init__(self, message: str = "Bad request", code: str = "BAD_REQUEST"):
        super().__init__(code=code, message=message, status_code=400)
