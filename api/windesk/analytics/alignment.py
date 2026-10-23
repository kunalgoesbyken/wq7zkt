import polars as pl

HALF_HOURS_PER_HOUR = 2


def hourly_mean(half_hourly: pl.DataFrame, value: str, alias: str) -> pl.DataFrame:
    return (
        half_hourly.group_by(pl.col("start_time").dt.truncate("1h"))
        .agg(pl.col(value).count().alias("periods"), pl.col(value).mean().alias(alias))
        .select("start_time", pl.when(pl.col("periods") == HALF_HOURS_PER_HOUR).then(alias).alias(alias))
        .sort("start_time")
    )


def with_actuals(hours: pl.DataFrame, actuals: pl.DataFrame) -> pl.DataFrame:
    return hours.join(actuals, on="start_time", how="left").with_columns(
        (pl.col("forecast_mw") - pl.col("actual_mw")).alias("error_mw")
    )


def with_demand(hours: pl.DataFrame, demand_forecasts: pl.DataFrame, demand_actuals: pl.DataFrame) -> pl.DataFrame:
    return hours.join(demand_forecasts, on="start_time", how="left").join(demand_actuals, on="start_time", how="left")


def with_net_demand(hours: pl.DataFrame) -> pl.DataFrame:
    demand_forecast = pl.col("demand_forecast_mw")
    return hours.with_columns(
        (demand_forecast - pl.col("forecast_mw")).alias("net_demand_forecast_mw"),
        (demand_forecast - pl.col("lower_mw")).alias("net_demand_plan_mw"),
        (pl.col("demand_actual_mw") - pl.col("actual_mw")).alias("net_demand_actual_mw"),
    )


def demand_errors(hours: pl.DataFrame) -> pl.DataFrame:
    actual = pl.col("demand_actual_mw")
    return hours.select(actual.alias("actual_mw"), (pl.col("demand_forecast_mw") - actual).alias("error_mw"))
