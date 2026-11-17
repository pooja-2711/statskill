
import httpx

from app.integrations.common.config import (
    INTEGRATION_TIMEOUT_SECONDS,
    INTEGRATION_MAX_RETRIES,
)


TIMEOUT = httpx.Timeout(INTEGRATION_TIMEOUT_SECONDS)


def create_http_client() -> httpx.Client:
    """Create a reusable synchronous HTTP client."""

    transport = httpx.HTTPTransport(
        retries=INTEGRATION_MAX_RETRIES
    )

    return httpx.Client(
        timeout=TIMEOUT,
        transport=transport,
        follow_redirects=True,
        headers={
            "User-Agent": "Statskill/1.0"
        },
    )


def create_async_http_client() -> httpx.AsyncClient:
    """Create a reusable asynchronous HTTP client."""

    transport = httpx.AsyncHTTPTransport(
        retries=INTEGRATION_MAX_RETRIES
    )

    return httpx.AsyncClient(
        timeout=TIMEOUT,
        transport=transport,
        follow_redirects=True,
        headers={
            "User-Agent": "Statskill/1.0"
        },
    )
