from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

import polars as pl

DAY = timedelta(days=1)


def local_to_utc(day: date, clock: time, timezone: str) -> datetime:
    return datetime.combine(day, clock, ZoneInfo(timezone)).astimezone(UTC)


def local_days_range(first_day: date, last_day: date, timezone: str, interval: str) -> pl.Series:
    start = local_to_utc(first_day, time.min, timezone)
    end = local_to_utc(last_day + DAY, time.min, timezone)
    return pl.datetime_range(start, end, interval, closed="left", eager=True, time_unit="us", time_zone="UTC")
