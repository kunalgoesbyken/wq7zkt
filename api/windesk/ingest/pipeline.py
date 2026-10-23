from datetime import UTC, datetime
from pathlib import Path

import httpx
import polars as pl

from windesk.ingest.config import IngestSettings
from windesk.ingest.elexon import (
    DEMAND_FIELD,
    DEMAND_OUTTURN_FIELD,
    DEMAND_OUTTURN_PATH,
    GENERATION_FIELD,
    Row,
    fetch_actuals,
    fetch_forecasts,
    stream_path,
)
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
from windesk.store import (
    ACTUALS_FILE,
    DEMAND_ACTUALS_FILE,
    DEMAND_FORECASTS_FILE,
    FORECASTS_FILE,
    MANIFEST_FILE,
    Manifest,
    ValidationReport,
)

Cleaned = tuple[pl.DataFrame, dict[str, int]]


def clean_actuals(rows: list[Row], value_field: str, constants: dict[str, str], prefix: str) -> Cleaned:
    parsed = parse(rows, value_field, constants)
    unique = deduplicated(parsed, ["start_time"])
    valid = without_negative(unique).sort("start_time")
    return valid, {
        f"{prefix}_rows_received": parsed.height,
        f"{prefix}_duplicates_dropped": parsed.height - unique.height,
        f"{prefix}_negative_dropped": unique.height - valid.height,
    }


def clean_forecasts(rows: list[Row], value_field: str, constants: dict[str, str], prefix: str) -> Cleaned:
    parsed = parse(rows, value_field, constants)
    unique = deduplicated(parsed, ["publish_time", "start_time"])
    non_negative = without_negative(unique)
    valid = without_hindcasts(non_negative).sort("publish_time", "start_time")
    return valid, {
        f"{prefix}_rows_received": parsed.height,
        f"{prefix}_duplicates_dropped": parsed.height - unique.height,
        f"{prefix}_negative_dropped": unique.height - non_negative.height,
        f"{prefix}_hindcasts_dropped": non_negative.height - valid.height,
    }


def coverage(
    actuals: pl.DataFrame,
    forecasts: pl.DataFrame,
    missing: int,
    demand_actuals: pl.DataFrame,
    demand_forecasts: pl.DataFrame,
    missing_demand: int,
) -> Coverage:
    runs = forecasts.get_column("publish_time").unique()
    demand_runs = demand_forecasts.get_column("publish_time").unique()
    return Coverage(
        actuals_from=actuals.get_column("start_time").min(),
        actuals_to=actuals.get_column("start_time").max(),
        actual_periods=actuals.height,
        missing_actual_periods=missing,
        forecast_runs=runs.len(),
        forecast_runs_from=runs.min(),
        forecast_runs_to=runs.max(),
        demand_actuals_from=demand_actuals.get_column("start_time").min(),
        demand_actuals_to=demand_actuals.get_column("start_time").max(),
        demand_actual_periods=demand_actuals.height,
        missing_demand_actual_periods=missing_demand,
        demand_forecast_runs=demand_runs.len(),
        demand_forecast_runs_from=demand_runs.min(),
        demand_forecast_runs_to=demand_runs.max(),
    )


def write(data_dir: Path, frames: dict[str, pl.DataFrame], manifest: Manifest) -> None:
    data_dir.mkdir(parents=True, exist_ok=True)
    for file_name, frame in frames.items():
        frame.write_parquet(data_dir / file_name)
    (data_dir / MANIFEST_FILE).write_text(manifest.model_dump_json(indent=2), encoding="utf-8")


def run(settings: Settings, ingest: IngestSettings) -> Manifest:
    fuel_filter = {"fuelType": settings.fuel_type}
    with httpx.Client(base_url=ingest.base_url, timeout=ingest.timeout_s) as client:
        actual_rows = fetch_actuals(client, ingest, stream_path(settings.actuals_dataset), fuel_filter)
        forecast_rows = fetch_forecasts(client, ingest, stream_path(settings.forecasts_dataset), {})
        demand_actual_rows = fetch_actuals(client, ingest, DEMAND_OUTTURN_PATH, {})
        demand_forecast_rows = fetch_forecasts(client, ingest, stream_path(settings.demand_forecasts_dataset), {})
    actuals, actual_counts = clean_actuals(
        actual_rows, GENERATION_FIELD, {"dataset": settings.actuals_dataset, **fuel_filter}, "actual"
    )
    forecasts, forecast_counts = clean_forecasts(
        forecast_rows, GENERATION_FIELD, {"dataset": settings.forecasts_dataset}, "forecast"
    )
    demand_actuals, demand_actual_counts = clean_actuals(demand_actual_rows, DEMAND_OUTTURN_FIELD, {}, "demand_actual")
    demand_forecasts, demand_forecast_counts = clean_forecasts(
        demand_forecast_rows,
        DEMAND_FIELD,
        {"dataset": settings.demand_forecasts_dataset, "boundary": settings.demand_forecast_boundary},
        "demand_forecast",
    )
    expected = expected_periods(ingest.actuals_from, ingest.actuals_to, ingest.settlement_timezone)
    missing = missing_periods(actuals, expected)
    missing_demand = missing_periods(demand_actuals, expected)
    manifest = Manifest(
        ingested_at=datetime.now(UTC),
        coverage=coverage(actuals, forecasts, len(missing), demand_actuals, demand_forecasts, len(missing_demand)),
        validation=ValidationReport(
            **actual_counts,
            **forecast_counts,
            **demand_actual_counts,
            **demand_forecast_counts,
            missing_actual_period_starts=missing,
            missing_demand_actual_period_starts=missing_demand,
        ),
    )
    frames = {
        ACTUALS_FILE: actuals,
        FORECASTS_FILE: forecasts,
        DEMAND_ACTUALS_FILE: demand_actuals,
        DEMAND_FORECASTS_FILE: demand_forecasts,
    }
    write(settings.data_dir, frames, manifest)
    return manifest
