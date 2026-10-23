from datetime import date, datetime
from typing import NamedTuple

import polars as pl

from windesk.analytics.alignment import with_actuals
from windesk.analytics.metrics import ABS_ERROR, ERROR, QUANTILE_METHOD, scored
from windesk.analytics.selection import TIMESTAMP, forecast_as_of, latest_run
from windesk.markets import delivery_bounds, delivery_hours, gate_closure_utc
from windesk.schemas import BandCoverage, DaySummary, DecisionDay, DecisionHour, Market, QualityFlag

MW_PER_GW = 1000
SECONDS_PER_HOUR = 3600
HOUR_FLAGS = (QualityFlag.FALLBACK_RUN, QualityFlag.NO_FORECAST, QualityFlag.NO_ACTUAL)


FORECAST_BUCKET = "forecast_bucket"
LOW_OFFSET = "low_offset_mw"
HIGH_OFFSET = "high_offset_mw"


class Band(NamedTuple):
    edges: list[float]
    offsets: pl.DataFrame
    calibration_days: int


class DayEvaluation(NamedTuple):
    delivery_date: date
    latest_run_utc: datetime | None
    calibration_days: int
    hours: pl.DataFrame


def delivery_targets(market: Market, delivery_dates: list[date]) -> pl.DataFrame:
    rows = [
        {"delivery_date": delivery_date, "start_time": hour, "cutoff": gate_closure_utc(market, delivery_date)}
        for delivery_date in delivery_dates
        for hour in delivery_hours(market, delivery_date)
    ]
    return pl.DataFrame(rows, schema={"delivery_date": pl.Date, "start_time": TIMESTAMP, "cutoff": TIMESTAMP})


def gate_closure_hours(
    market: Market, delivery_dates: list[date], forecasts: pl.DataFrame, actuals: pl.DataFrame
) -> pl.DataFrame:
    selected = forecast_as_of(delivery_targets(market, delivery_dates), forecasts)
    return with_actuals(selected, actuals).sort("start_time")


def forecast_bucket(edges: list[float]) -> pl.Expr:
    labels = [str(index) for index in range(len(edges) + 1)]
    return pl.col("forecast_mw").cut(edges, labels=labels).cast(pl.String).alias(FORECAST_BUCKET)


def bucket_edges(calibration: pl.DataFrame, buckets: int) -> list[float]:
    forecast = calibration.get_column("forecast_mw")
    edges = (forecast.quantile(step / buckets, QUANTILE_METHOD) for step in range(1, buckets))
    return sorted({edge for edge in edges if edge is not None})


def order_statistic(values: pl.Expr, rank: pl.Expr) -> pl.Expr:
    return values.sort().get(rank.cast(pl.Int64).clip(1, pl.len()) - 1)


def calibration_band(
    gate_hours: pl.DataFrame, excluded_date: date, quantiles: tuple[float, float], buckets: int
) -> Band:
    residual = -ERROR
    low, high = quantiles
    sample_size = pl.len() + 1
    calibration = scored(gate_hours).filter(pl.col("delivery_date") != excluded_date)
    edges = bucket_edges(calibration, buckets)
    offsets = calibration.group_by(forecast_bucket(edges)).agg(
        order_statistic(residual, (sample_size * low).floor()).alias(LOW_OFFSET),
        order_statistic(residual, (sample_size * high).ceil()).alias(HIGH_OFFSET),
    )
    return Band(edges, offsets, calibration.get_column("delivery_date").n_unique())


def with_band(hours: pl.DataFrame, band: Band) -> pl.DataFrame:
    forecast = pl.col("forecast_mw")
    return (
        hours.with_columns(forecast_bucket(band.edges))
        .join(band.offsets, on=FORECAST_BUCKET, how="left", maintain_order="left")
        .with_columns(
            (forecast + pl.col(LOW_OFFSET)).clip(lower_bound=0).alias("lower_mw"),
            (forecast + pl.col(HIGH_OFFSET)).alias("upper_mw"),
        )
        .drop(FORECAST_BUCKET, LOW_OFFSET, HIGH_OFFSET)
    )


def with_quality(hours: pl.DataFrame, latest_run_utc: datetime | None) -> pl.DataFrame:
    source = pl.col("source_publish_time")
    return hours.with_columns(
        ((pl.col("start_time") - source).dt.total_seconds() / SECONDS_PER_HOUR).alias("forecast_age_h"),
        (source < pl.lit(latest_run_utc, TIMESTAMP)).fill_null(False).alias(QualityFlag.FALLBACK_RUN),
        pl.col("forecast_mw").is_null().alias(QualityFlag.NO_FORECAST),
        pl.col("actual_mw").is_null().alias(QualityFlag.NO_ACTUAL),
    )


def evaluate_day(
    market: Market,
    delivery_date: date,
    gate_hours: pl.DataFrame,
    forecasts: pl.DataFrame,
    band_quantiles: tuple[float, float],
    band_buckets: int,
) -> DayEvaluation:
    latest_run_utc = latest_run(forecasts, gate_closure_utc(market, delivery_date))
    band = calibration_band(gate_hours, delivery_date, band_quantiles, band_buckets)
    day_hours = gate_hours.filter(pl.col("delivery_date") == delivery_date)
    hours = with_quality(with_band(day_hours, band), latest_run_utc)
    return DayEvaluation(delivery_date, latest_run_utc, band.calibration_days, hours)


def gwh(column: str) -> pl.Expr:
    values = pl.col(column)
    return pl.when(values.count() > 0).then(values.sum() / MW_PER_GW)


def day_flags(hours: pl.DataFrame, coverage_ratio: float) -> list[QualityFlag]:
    raised = [flag for flag in HOUR_FLAGS if hours.get_column(flag).any()]
    return [*raised, QualityFlag.PARTIAL_COVERAGE] if coverage_ratio < 1 else raised


def day_summary(evaluation: DayEvaluation) -> DaySummary:
    hours = evaluation.hours
    totals = hours.select(
        gwh("forecast_mw").alias("expected_gwh"),
        gwh("lower_mw").alias("lower_gwh"),
        gwh("actual_mw").alias("actual_gwh"),
        ABS_ERROR.mean().alias("mae_mw"),
        ERROR.mean().alias("bias_mw"),
        pl.len().alias("hours_total"),
        pl.col("forecast_mw").count().alias("hours_forecast"),
    ).row(0, named=True)
    coverage_ratio = totals["hours_forecast"] / totals["hours_total"]
    at_risk = None if totals["lower_gwh"] is None else totals["expected_gwh"] - totals["lower_gwh"]
    return DaySummary(
        delivery_date=evaluation.delivery_date,
        energy_at_risk_gwh=at_risk,
        coverage_ratio=coverage_ratio,
        flags=day_flags(hours, coverage_ratio),
        **totals,
    )


def band_coverage(evaluations: list[DayEvaluation]) -> BandCoverage:
    actual = pl.col("actual_mw")
    lower = pl.col("lower_mw")
    judged = pl.concat([evaluation.hours for evaluation in evaluations]).filter(
        actual.is_not_null() & lower.is_not_null()
    )
    stats = judged.select(
        pl.len().alias("n"),
        (actual >= lower).mean().alias("at_or_above_lower_ratio"),
        actual.is_between(lower, pl.col("upper_mw")).mean().alias("within_band_ratio"),
    )
    return BandCoverage(**stats.row(0, named=True))


def decision_hours(hours: pl.DataFrame) -> list[DecisionHour]:
    return [
        DecisionHour(**row, flags=[flag for flag in HOUR_FLAGS if row[flag]]) for row in hours.iter_rows(named=True)
    ]


def decision_day(market: Market, evaluation: DayEvaluation) -> DecisionDay:
    delivery_start_utc, delivery_end_utc = delivery_bounds(market, evaluation.delivery_date)
    return DecisionDay(
        market_id=market.id,
        delivery_date=evaluation.delivery_date,
        gate_closure_utc=gate_closure_utc(market, evaluation.delivery_date),
        delivery_start_utc=delivery_start_utc,
        delivery_end_utc=delivery_end_utc,
        latest_run_utc=evaluation.latest_run_utc,
        calibration_days=evaluation.calibration_days,
        summary=day_summary(evaluation),
        hours=decision_hours(evaluation.hours),
    )
