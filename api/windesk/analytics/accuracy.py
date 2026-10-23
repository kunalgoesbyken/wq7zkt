import polars as pl

from windesk.analytics.alignment import with_actuals
from windesk.analytics.metrics import grouped_metrics, histogram, metrics
from windesk.analytics.selection import TIMESTAMP, forecast_as_of
from windesk.localtime import local_days_range
from windesk.schemas import AccuracyPoint, AccuracyReport, Basis, DateWindow, HorizonPoint, HourOfDayStat

HOURS_OF_DAY = pl.Series(range(24), dtype=pl.Int64)


def local_day_hours(window: DateWindow, timezone: str) -> pl.DataFrame:
    hours = local_days_range(window.start, window.end, timezone, "1h")
    return (
        hours.alias("start_time")
        .to_frame()
        .with_columns(pl.col("start_time").dt.convert_time_zone(timezone).dt.date().alias("target_date"))
    )


def horizon_hours(
    hours: pl.DataFrame, max_horizon_h: int, forecasts: pl.DataFrame, actuals: pl.DataFrame
) -> pl.DataFrame:
    horizons = pl.Series("horizon_h", range(max_horizon_h + 1), dtype=pl.Int64).to_frame()
    targets = hours.join(horizons, how="cross").with_columns(
        (pl.col("start_time") - pl.duration(hours=pl.col("horizon_h"))).cast(TIMESTAMP).alias("cutoff")
    )
    return with_actuals(forecast_as_of(targets, forecasts, "forecast_mw"), actuals).sort("horizon_h", "start_time")


def by_hour(hours: pl.DataFrame, timezone: str) -> list[HourOfDayStat]:
    local_hour = pl.col("start_time").dt.convert_time_zone(timezone).dt.hour().cast(pl.Int64)
    stats = grouped_metrics(hours.with_columns(local_hour.alias("hour")), "hour", HOURS_OF_DAY)
    return [HourOfDayStat(**row) for row in stats.iter_rows(named=True)]


def accuracy_report(
    basis: Basis,
    horizon_h: int | None,
    market_id: str | None,
    window: DateWindow,
    hours: pl.DataFrame,
    bin_width_mw: float,
    timezone: str,
) -> AccuracyReport:
    return AccuracyReport(
        basis=basis,
        horizon_h=horizon_h,
        market_id=market_id,
        window=window,
        metrics=metrics(hours),
        series=[AccuracyPoint(**row) for row in hours.iter_rows(named=True)],
        histogram=histogram(hours, bin_width_mw),
        by_hour=by_hour(hours, timezone),
    )


def horizon_curve(hours: pl.DataFrame, max_horizon_h: int) -> list[HorizonPoint]:
    horizons = pl.Series(range(max_horizon_h + 1), dtype=pl.Int64)
    stats = grouped_metrics(hours, "horizon_h", horizons)
    return [HorizonPoint(**row) for row in stats.iter_rows(named=True)]
