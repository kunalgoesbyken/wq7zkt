import math
from collections import Counter

import polars as pl

from windesk.schemas import HistogramBin, Metrics

QUANTILE_METHOD = "linear"
ERROR = pl.col("error_mw")
ABS_ERROR = ERROR.abs()


def nmae_pct() -> pl.Expr:
    mean_actual = pl.col("actual_mw").mean()
    return pl.when(mean_actual > 0).then(ABS_ERROR.mean() / mean_actual * 100)


METRIC_EXPRESSIONS = [
    pl.len().alias("n"),
    ABS_ERROR.mean().alias("mae_mw"),
    ERROR.pow(2).mean().sqrt().alias("rmse_mw"),
    ERROR.mean().alias("bias_mw"),
    ABS_ERROR.quantile(0.5, QUANTILE_METHOD).alias("p50_abs_error_mw"),
    ABS_ERROR.quantile(0.9, QUANTILE_METHOD).alias("p90_abs_error_mw"),
    nmae_pct().alias("nmae_pct"),
]


def scored(frame: pl.DataFrame) -> pl.DataFrame:
    return frame.filter(ERROR.is_not_null())


def metrics(frame: pl.DataFrame) -> Metrics:
    return Metrics(**scored(frame).select(METRIC_EXPRESSIONS).row(0, named=True))


def grouped_metrics(frame: pl.DataFrame, key: str, keys: pl.Series) -> pl.DataFrame:
    stats = scored(frame).group_by(key).agg(METRIC_EXPRESSIONS)
    return keys.alias(key).to_frame().join(stats, on=key, how="left").with_columns(pl.col("n").fill_null(0))


def histogram(frame: pl.DataFrame, bin_width_mw: float) -> list[HistogramBin]:
    errors = scored(frame).get_column("error_mw").to_list()
    if not errors:
        return []
    indices = Counter(math.floor(error / bin_width_mw) for error in errors)
    return [
        HistogramBin(lower_mw=index * bin_width_mw, upper_mw=(index + 1) * bin_width_mw, count=indices[index])
        for index in range(min(indices), max(indices) + 1)
    ]
