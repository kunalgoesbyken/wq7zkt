import time
from collections.abc import Callable, Iterator
from datetime import date, timedelta
from http import HTTPStatus
from typing import Any

import httpx

from windesk.ingest.config import IngestSettings

Row = dict[str, Any]
Window = Callable[[date, date], dict[str, str]]
DAY = timedelta(days=1)
DEMAND_OUTTURN_PATH = "/demand/outturn/stream"
GENERATION_FIELD = "generation"
DEMAND_FIELD = "demand"
DEMAND_OUTTURN_FIELD = "initialDemandOutturn"
RETRYABLE_STATUSES = frozenset(
    {
        HTTPStatus.TOO_MANY_REQUESTS,
        HTTPStatus.INTERNAL_SERVER_ERROR,
        HTTPStatus.BAD_GATEWAY,
        HTTPStatus.SERVICE_UNAVAILABLE,
        HTTPStatus.GATEWAY_TIMEOUT,
    }
)


def date_chunks(start: date, end: date, days: int) -> Iterator[tuple[date, date]]:
    cursor = start
    while cursor <= end:
        chunk_end = min(cursor + DAY * (days - 1), end)
        yield cursor, chunk_end
        cursor = chunk_end + DAY


def is_retryable(error: httpx.HTTPError) -> bool:
    if isinstance(error, httpx.HTTPStatusError):
        return error.response.status_code in RETRYABLE_STATUSES
    return isinstance(error, httpx.TransportError)


def request_rows(client: httpx.Client, path: str, params: dict[str, str]) -> list[Row]:
    response = client.get(path, params=params)
    response.raise_for_status()
    return response.json()


def fetch_rows(client: httpx.Client, path: str, params: dict[str, str], settings: IngestSettings) -> list[Row]:
    for attempt in range(settings.max_attempts - 1):
        try:
            return request_rows(client, path, params)
        except httpx.HTTPError as error:
            if not is_retryable(error):
                raise
        time.sleep(settings.backoff_s * 2**attempt)
    return request_rows(client, path, params)


def stream_path(dataset: str) -> str:
    return f"/datasets/{dataset}/stream"


def utc_midnight(day: date) -> str:
    return f"{day.isoformat()}T00:00:00Z"


def settlement_window(start: date, end: date) -> dict[str, str]:
    return {"settlementDateFrom": start.isoformat(), "settlementDateTo": end.isoformat()}


def publish_window(start: date, end: date) -> dict[str, str]:
    return {"publishDateTimeFrom": utc_midnight(start), "publishDateTimeTo": utc_midnight(end + DAY)}


def fetch_chunked(
    client: httpx.Client,
    settings: IngestSettings,
    path: str,
    params: dict[str, str],
    window: Window,
    chunks: Iterator[tuple[date, date]],
) -> list[Row]:
    return [
        row for start, end in chunks for row in fetch_rows(client, path, {**window(start, end), **params}, settings)
    ]


def fetch_actuals(client: httpx.Client, settings: IngestSettings, path: str, params: dict[str, str]) -> list[Row]:
    chunks = date_chunks(settings.actuals_from, settings.actuals_to, settings.chunk_days)
    return fetch_chunked(client, settings, path, params, settlement_window, chunks)


def fetch_forecasts(client: httpx.Client, settings: IngestSettings, path: str, params: dict[str, str]) -> list[Row]:
    chunks = date_chunks(settings.forecast_runs_from, settings.forecast_runs_to, settings.chunk_days)
    return fetch_chunked(client, settings, path, params, publish_window, chunks)
