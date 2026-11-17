
class IntegrationError(Exception):
    """Base exception for external integration failures."""

    def __init__(
        self,
        message: str,
        provider: str | None = None,
    ):
        self.provider = provider
        self.message = message

        if provider:
            message = f"{provider}: {message}"

        super().__init__(message)


class IntegrationConnectionError(IntegrationError):
    """Raised when an external provider cannot be reached."""


class IntegrationTimeoutError(IntegrationError):
    """Raised when an external provider takes too long."""


class IntegrationResponseError(IntegrationError):
    """Raised when an external provider returns an invalid response."""
