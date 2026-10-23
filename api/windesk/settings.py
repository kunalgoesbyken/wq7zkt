from datetime import date
from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

PACKAGE_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="WINDESK_")

    auction_start: date = date(2026, 1, 1)
    auction_end: date = date(2026, 1, 31)
    data_dir: Path = PACKAGE_DIR.parent / "data"
    markets_file: Path = PACKAGE_DIR / "config" / "markets.json"
    actuals_dataset: str = "FUELHH"
    forecasts_dataset: str = "WINDFOR"
    demand_actuals_dataset: str = "INDO"
    demand_forecasts_dataset: str = "NDF"
    demand_forecast_boundary: str = "N"
    fuel_type: str = "WIND"
    band_quantiles: tuple[float, float] = (0.1, 0.9)
    band_forecast_buckets: int = Field(default=3, ge=1)
    histogram_bin_mw: float = 500.0
    max_horizon_h: int = 48
    default_horizon_h: int = 24
    reporting_timezone: str = "Europe/London"
    cache_control: str = "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
