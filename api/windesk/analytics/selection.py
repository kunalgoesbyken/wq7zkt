from datetime import datetime

import polars as pl

TIMESTAMP = pl.Datetime("us", "UTC")


def forecast_as_of(targets: pl.DataFrame, forecasts: pl.DataFrame) -> pl.DataFrame:
    runs = forecasts.select(
        "start_time",
        pl.col("publish_time").alias("source_publish_time"),
        pl.col("generation_mw").alias("forecast_mw"),
    ).sort("source_publish_time")
    return targets.sort("cutoff").join_asof(
        runs,
        left_on="cutoff",
        right_on="source_publish_time",
        by="start_time",
        strategy="backward",
        check_sortedness=False,
    )


def latest_run(forecasts: pl.DataFrame, cutoff: datetime) -> datetime | None:
    return forecasts.filter(pl.col("publish_time") <= cutoff).get_column("publish_time").max()
