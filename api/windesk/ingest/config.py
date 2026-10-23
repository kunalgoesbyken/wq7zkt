from datetime import date

from pydantic_settings import BaseSettings, SettingsConfigDict


class IngestSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="WINDESK_INGEST_")

    base_url: str = "https://data.elexon.co.uk/bmrs/api/v1"
    actuals_from: date = date(2025, 12, 31)
    actuals_to: date = date(2026, 2, 2)
    forecast_runs_from: date = date(2025, 12, 28)
    forecast_runs_to: date = date(2026, 2, 2)
    settlement_timezone: str = "Europe/London"
    chunk_days: int = 7
    timeout_s: float = 60.0
    max_attempts: int = 4
    backoff_s: float = 1.0
