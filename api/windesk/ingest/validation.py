from datetime import date, datetime

import polars as pl

from windesk.ingest.elexon import Row
from windesk.localtime import local_days_range

SOURCE_FIELDS = frozenset({"publishTime", "startTime"})
HALF_HOUR = "30m"


class SchemaViolation(ValueError):
    pass


def require_columns(frame: pl.DataFrame, columns: frozenset[str]) -> None:
    missing = columns - set(frame.columns)
    if missing:
        raise SchemaViolation(f"missing fields: {sorted(missing)}")


def require_constant(frame: pl.DataFrame, column: str, expected: str) -> None:
    unexpected = frame.filter(pl.col(column) != expected).height
    if unexpected:
        raise SchemaViolation(f"{unexpected} rows where {column} != {expected}")


def parse(rows: list[Row], value_field: str, constants: dict[str, str]) -> pl.DataFrame:
    frame = pl.DataFrame(rows, infer_schema_length=None)
    require_columns(frame, SOURCE_FIELDS.union(constants, {value_field}))
    for column, expected in constants.items():
        require_constant(frame, column, expected)
    return frame.select(
        pl.col("publishTime").str.to_datetime(time_unit="us", time_zone="UTC").alias("publish_time"),
        pl.col("startTime").str.to_datetime(time_unit="us", time_zone="UTC").alias("start_time"),
        pl.col(value_field).cast(pl.Float64).alias("value_mw"),
    )


def deduplicated(frame: pl.DataFrame, keys: list[str]) -> pl.DataFrame:
    return frame.sort("publish_time", maintain_order=True).unique(subset=keys, keep="last", maintain_order=True)


def without_negative(frame: pl.DataFrame) -> pl.DataFrame:
    return frame.filter(pl.col("value_mw") >= 0)


def without_hindcasts(frame: pl.DataFrame) -> pl.DataFrame:
    return frame.filter(pl.col("start_time") >= pl.col("publish_time"))


def expected_periods(first_day: date, last_day: date, timezone: str) -> pl.DataFrame:
    return local_days_range(first_day, last_day, timezone, HALF_HOUR).alias("start_time").to_frame()


def missing_periods(actuals: pl.DataFrame, expected: pl.DataFrame) -> list[datetime]:
    return expected.join(actuals, on="start_time", how="anti").get_column("start_time").to_list()
