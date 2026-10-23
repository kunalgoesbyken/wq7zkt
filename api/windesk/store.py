from datetime import datetime
from functools import lru_cache
from pathlib import Path
from typing import Protocol

import polars as pl

from windesk.schemas import Coverage, Schema
from windesk.settings import get_settings

ACTUALS_FILE = "actuals.parquet"
FORECASTS_FILE = "forecasts.parquet"
DEMAND_ACTUALS_FILE = "demand_actuals.parquet"
DEMAND_FORECASTS_FILE = "demand_forecasts.parquet"
MANIFEST_FILE = "manifest.json"


class ValidationReport(Schema):
    actual_rows_received: int
    actual_duplicates_dropped: int
    actual_negative_dropped: int
    forecast_rows_received: int
    forecast_duplicates_dropped: int
    forecast_negative_dropped: int
    forecast_hindcasts_dropped: int
    demand_actual_rows_received: int
    demand_actual_duplicates_dropped: int
    demand_actual_negative_dropped: int
    demand_forecast_rows_received: int
    demand_forecast_duplicates_dropped: int
    demand_forecast_negative_dropped: int
    demand_forecast_hindcasts_dropped: int
    missing_actual_period_starts: list[datetime]
    missing_demand_actual_period_starts: list[datetime]


class Manifest(Schema):
    ingested_at: datetime
    coverage: Coverage
    validation: ValidationReport


class ForecastStore(Protocol):
    def actuals(self) -> pl.DataFrame: ...

    def forecasts(self) -> pl.DataFrame: ...

    def demand_actuals(self) -> pl.DataFrame: ...

    def demand_forecasts(self) -> pl.DataFrame: ...

    def manifest(self) -> Manifest: ...


class ParquetStore:
    def __init__(self, data_dir: Path) -> None:
        self._actuals = pl.read_parquet(data_dir / ACTUALS_FILE)
        self._forecasts = pl.read_parquet(data_dir / FORECASTS_FILE)
        self._demand_actuals = pl.read_parquet(data_dir / DEMAND_ACTUALS_FILE)
        self._demand_forecasts = pl.read_parquet(data_dir / DEMAND_FORECASTS_FILE)
        self._manifest = Manifest.model_validate_json((data_dir / MANIFEST_FILE).read_text(encoding="utf-8"))

    def actuals(self) -> pl.DataFrame:
        return self._actuals

    def forecasts(self) -> pl.DataFrame:
        return self._forecasts

    def demand_actuals(self) -> pl.DataFrame:
        return self._demand_actuals

    def demand_forecasts(self) -> pl.DataFrame:
        return self._demand_forecasts

    def manifest(self) -> Manifest:
        return self._manifest


@lru_cache(maxsize=1)
def get_store() -> ForecastStore:
    return ParquetStore(get_settings().data_dir)
