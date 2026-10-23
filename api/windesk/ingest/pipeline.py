from datetime import UTC, datetime
from pathlib import Path

import httpx
import polars as pl

from windesk.ingest.config import IngestSettings
from windesk.ingest.elexon import Row, fetch_actuals, fetch_forecasts
from windesk.ingest.validation import (
    deduplicated,
    expected_periods,
    missing_periods,
    parse,
    without_hindcasts,
    without_negative,
)
from windesk.schemas import Coverage
from windesk.settings import Settings
from windesk.store import ACTUALS_FILE, FORECASTS_FILE, MANIFEST_FILE, Manifest, ValidationReport


def clean_actuals(rows: list[Row], settings: Settings) -> tuple[pl.DataFrame, dict[str, int]]:
    parsed = parse(rows, {"dataset": settings.actuals_dataset, "fuelType": settings.fuel_type})
    unique = deduplicated(parsed, ["start_time"])
    valid = without_negative(unique).sort("start_time")
    return valid, {
        "actual_rows_received": parsed.height,
        "actual_duplicates_dropped": parsed.height - unique.height,
        "actual_negative_dropped": unique.height - valid.height,
    }


def clean_forecasts(rows: list[Row], settings: Settings) -> tuple[pl.DataFrame, dict[str, int]]:
    parsed = parse(rows, {"dataset": settings.forecasts_dataset})
    unique = deduplicated(parsed, ["publish_time", "start_time"])
    non_negative = without_negative(unique)
    valid = without_hindcasts(non_negative).sort("publish_time", "start_time")
    return valid, {
        "forecast_rows_received": parsed.height,
        "forecast_duplicates_dropped": parsed.height - unique.height,
        "forecast_negative_dropped": unique.height - non_negative.height,
        "forecast_hindcasts_dropped": non_negative.height - valid.height,
    }


def coverage(actuals: pl.DataFrame, forecasts: pl.DataFrame, missing: int) -> Coverage:
    runs = forecasts.get_column("publish_time").unique()
    return Coverage(
        actuals_from=actuals.get_column("start_time").min(),
        actuals_to=actuals.get_column("start_time").max(),
        actual_periods=actuals.height,
        missing_actual_periods=missing,
        forecast_runs=runs.len(),
        forecast_runs_from=runs.min(),
        forecast_runs_to=runs.max(),
    )


def write(data_dir: Path, actuals: pl.DataFrame, forecasts: pl.DataFrame, manifest: Manifest) -> None:
    data_dir.mkdir(parents=True, exist_ok=True)
    actuals.write_parquet(data_dir / ACTUALS_FILE)
    forecasts.write_parquet(data_dir / FORECASTS_FILE)
    (data_dir / MANIFEST_FILE).write_text(manifest.model_dump_json(indent=2), encoding="utf-8")


def run(settings: Settings, ingest: IngestSettings) -> Manifest:
    with httpx.Client(base_url=ingest.base_url, timeout=ingest.timeout_s) as client:
        actual_rows = fetch_actuals(client, ingest, settings.actuals_dataset, settings.fuel_type)
        forecast_rows = fetch_forecasts(client, ingest, settings.forecasts_dataset)
    actuals, actual_counts = clean_actuals(actual_rows, settings)
    forecasts, forecast_counts = clean_forecasts(forecast_rows, settings)
    expected = expected_periods(ingest.actuals_from, ingest.actuals_to, ingest.settlement_timezone)
    missing = missing_periods(actuals, expected)
    manifest = Manifest(
        ingested_at=datetime.now(UTC),
        coverage=coverage(actuals, forecasts, len(missing)),
        validation=ValidationReport(**actual_counts, **forecast_counts, missing_actual_period_starts=missing),
    )
    write(settings.data_dir, actuals, forecasts, manifest)
    return manifest
