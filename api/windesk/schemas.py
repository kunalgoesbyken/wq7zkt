from datetime import date, datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class Schema(BaseModel):
    model_config = ConfigDict(frozen=True)


class QualityFlag(StrEnum):
    FALLBACK_RUN = "FALLBACK_RUN"
    NO_FORECAST = "NO_FORECAST"
    NO_ACTUAL = "NO_ACTUAL"
    PARTIAL_COVERAGE = "PARTIAL_COVERAGE"


class Basis(StrEnum):
    HORIZON = "horizon"
    GATE_CLOSURE = "gate_closure"


class Market(Schema):
    id: str
    venue: str
    timezone: str
    gate_closure_local: str = Field(examples=["09:50"])
    gate_closure_days_before: int
    delivery_start_local: str = Field(examples=["23:00"])


class MarketsResponse(Schema):
    default_market_id: str
    markets: list[Market]


class DateWindow(Schema):
    start: date
    end: date


class Coverage(Schema):
    actuals_from: datetime
    actuals_to: datetime
    actual_periods: int
    missing_actual_periods: int
    forecast_runs: int
    forecast_runs_from: datetime
    forecast_runs_to: datetime


class MetaResponse(Schema):
    actuals_dataset: str
    forecasts_dataset: str
    fuel_type: str
    auction_window: DateWindow
    delivery_window: DateWindow
    max_horizon_h: int
    reporting_timezone: str
    band_quantiles: tuple[float, float]
    coverage: Coverage
    ingested_at: datetime


class Metrics(Schema):
    n: int
    mae_mw: float | None
    rmse_mw: float | None
    bias_mw: float | None
    p50_abs_error_mw: float | None
    p90_abs_error_mw: float | None
    nmae_pct: float | None


class DecisionHour(Schema):
    start_time: datetime
    forecast_mw: float | None
    actual_mw: float | None
    error_mw: float | None
    lower_mw: float | None
    upper_mw: float | None
    source_publish_time: datetime | None
    forecast_age_h: float | None
    flags: list[QualityFlag]


class DaySummary(Schema):
    delivery_date: date
    expected_gwh: float | None
    lower_gwh: float | None
    energy_at_risk_gwh: float | None
    actual_gwh: float | None
    mae_mw: float | None
    bias_mw: float | None
    hours_total: int
    hours_forecast: int
    coverage_ratio: float
    flags: list[QualityFlag]


class DecisionDay(Schema):
    market_id: str
    delivery_date: date
    gate_closure_utc: datetime
    delivery_start_utc: datetime
    delivery_end_utc: datetime
    latest_run_utc: datetime | None
    calibration_days: int
    summary: DaySummary
    hours: list[DecisionHour]


class DecisionCalendar(Schema):
    market_id: str
    metrics: Metrics
    days: list[DaySummary]


class AccuracyPoint(Schema):
    start_time: datetime
    forecast_mw: float | None
    actual_mw: float | None
    error_mw: float | None


class HistogramBin(Schema):
    lower_mw: float
    upper_mw: float
    count: int


class HourOfDayStat(Schema):
    hour: int
    n: int
    mae_mw: float | None
    bias_mw: float | None


class AccuracyReport(Schema):
    basis: Basis
    horizon_h: int | None
    market_id: str | None
    window: DateWindow
    metrics: Metrics
    series: list[AccuracyPoint]
    histogram: list[HistogramBin]
    by_hour: list[HourOfDayStat]


class HorizonPoint(Schema):
    horizon_h: int
    n: int
    mae_mw: float | None
    rmse_mw: float | None
    bias_mw: float | None
    p90_abs_error_mw: float | None


class HorizonCurve(Schema):
    window: DateWindow
    points: list[HorizonPoint]


class ErrorBody(Schema):
    code: str
    detail: str
