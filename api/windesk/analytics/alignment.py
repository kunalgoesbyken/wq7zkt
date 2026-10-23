import polars as pl

HALF_HOURS_PER_HOUR = 2


def hourly_actuals(half_hourly: pl.DataFrame) -> pl.DataFrame:
    return (
        half_hourly.group_by(pl.col("start_time").dt.truncate("1h"))
        .agg(pl.len().alias("periods"), pl.col("generation_mw").mean().alias("actual_mw"))
        .select("start_time", pl.when(pl.col("periods") == HALF_HOURS_PER_HOUR).then("actual_mw").alias("actual_mw"))
        .sort("start_time")
    )


def with_actuals(hours: pl.DataFrame, actuals: pl.DataFrame) -> pl.DataFrame:
    return hours.join(actuals, on="start_time", how="left").with_columns(
        (pl.col("forecast_mw") - pl.col("actual_mw")).alias("error_mw")
    )
