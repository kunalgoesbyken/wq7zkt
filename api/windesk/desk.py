from datetime import date, timedelta
from functools import cache, cached_property, lru_cache

import polars as pl

from windesk.analytics.accuracy import accuracy_report, horizon_hours, local_day_hours
from windesk.analytics.accuracy import horizon_curve as horizon_points
from windesk.analytics.alignment import hourly_actuals
from windesk.analytics.decision import (
    DayEvaluation,
    band_coverage,
    day_summary,
    decision_day,
    evaluate_day,
    gate_closure_hours,
)
from windesk.analytics.metrics import metrics
from windesk.errors import invalid_range, out_of_window
from windesk.markets import delivery_window, find_market, load_catalog
from windesk.schemas import (
    AccuracyReport,
    Basis,
    DateWindow,
    DecisionCalendar,
    DecisionDay,
    HorizonCurve,
    Market,
    MarketsResponse,
    MetaResponse,
)
from windesk.settings import Settings, get_settings
from windesk.store import ForecastStore, get_store


def window_dates(window: DateWindow) -> list[date]:
    return [window.start + timedelta(days=offset) for offset in range((window.end - window.start).days + 1)]


def require_within(requested: date, bounds: DateWindow) -> None:
    if not bounds.start <= requested <= bounds.end:
        raise out_of_window(requested, bounds.start, bounds.end)


def resolve_window(start: date | None, end: date | None, bounds: DateWindow) -> DateWindow:
    window = DateWindow(start=start or bounds.start, end=end or bounds.end)
    require_within(window.start, bounds)
    require_within(window.end, bounds)
    if window.start > window.end:
        raise invalid_range(window.start, window.end)
    return window


class Desk:
    def __init__(self, store: ForecastStore, settings: Settings, catalog: MarketsResponse) -> None:
        self.settings = settings
        self.catalog = catalog
        self.manifest = store.manifest()
        self.forecasts = store.forecasts()
        self.actuals = hourly_actuals(store.actuals())
        self.auction_window = DateWindow(start=settings.auction_start, end=settings.auction_end)
        self.gate_closure_hours = cache(self._gate_closure_hours)
        self.evaluation = cache(self._evaluation)

    def market(self, market_id: str | None) -> Market:
        return find_market(self.catalog, market_id)

    def delivery_window(self, market: Market) -> DateWindow:
        return delivery_window(market, self.auction_window)

    @cached_property
    def target_window(self) -> DateWindow:
        return self.delivery_window(self.market(None))

    @cached_property
    def horizon_frame(self) -> pl.DataFrame:
        hours = local_day_hours(self.target_window, self.settings.reporting_timezone)
        return horizon_hours(hours, self.settings.max_horizon_h, self.forecasts, self.actuals)

    def _gate_closure_hours(self, market: Market) -> pl.DataFrame:
        dates = window_dates(self.delivery_window(market))
        return gate_closure_hours(market, dates, self.forecasts, self.actuals)

    def _evaluation(self, market: Market, delivery_date: date) -> DayEvaluation:
        gate_hours = self.gate_closure_hours(market)
        return evaluate_day(
            market,
            delivery_date,
            gate_hours,
            self.forecasts,
            self.settings.band_quantiles,
            self.settings.band_forecast_buckets,
        )

    def meta(self) -> MetaResponse:
        return MetaResponse(
            actuals_dataset=self.settings.actuals_dataset,
            forecasts_dataset=self.settings.forecasts_dataset,
            fuel_type=self.settings.fuel_type,
            auction_window=self.auction_window,
            delivery_window=self.target_window,
            max_horizon_h=self.settings.max_horizon_h,
            reporting_timezone=self.settings.reporting_timezone,
            band_quantiles=self.settings.band_quantiles,
            coverage=self.manifest.coverage,
            ingested_at=self.manifest.ingested_at,
        )

    def calendar(self, market_id: str | None, start: date | None, end: date | None) -> DecisionCalendar:
        market = self.market(market_id)
        window = resolve_window(start, end, self.delivery_window(market))
        hours = self.gate_closure_hours(market).filter(pl.col("delivery_date").is_between(window.start, window.end))
        evaluations = [self.evaluation(market, delivery_date) for delivery_date in window_dates(window)]
        return DecisionCalendar(
            market_id=market.id,
            metrics=metrics(hours),
            band_coverage=band_coverage(evaluations),
            days=[day_summary(evaluation) for evaluation in evaluations],
        )

    def decision_day(self, market_id: str | None, delivery_date: date) -> DecisionDay:
        market = self.market(market_id)
        require_within(delivery_date, self.delivery_window(market))
        return decision_day(market, self.evaluation(market, delivery_date))

    def accuracy(
        self, basis: Basis, horizon_h: int, market_id: str | None, start: date | None, end: date | None
    ) -> AccuracyReport:
        if basis is Basis.GATE_CLOSURE:
            return self.gate_closure_accuracy(market_id, start, end)
        return self.horizon_accuracy(horizon_h, start, end)

    def gate_closure_accuracy(self, market_id: str | None, start: date | None, end: date | None) -> AccuracyReport:
        market = self.market(market_id)
        window = resolve_window(start, end, self.delivery_window(market))
        hours = self.gate_closure_hours(market).filter(pl.col("delivery_date").is_between(window.start, window.end))
        return self.report(Basis.GATE_CLOSURE, None, market.id, window, hours)

    def horizon_accuracy(self, horizon_h: int, start: date | None, end: date | None) -> AccuracyReport:
        window = resolve_window(start, end, self.target_window)
        hours = self.horizon_window(window).filter(pl.col("horizon_h") == horizon_h)
        return self.report(Basis.HORIZON, horizon_h, None, window, hours)

    def horizon_window(self, window: DateWindow) -> pl.DataFrame:
        return self.horizon_frame.filter(pl.col("target_date").is_between(window.start, window.end))

    def report(
        self, basis: Basis, horizon_h: int | None, market_id: str | None, window: DateWindow, hours: pl.DataFrame
    ) -> AccuracyReport:
        return accuracy_report(
            basis,
            horizon_h,
            market_id,
            window,
            hours,
            self.settings.histogram_bin_mw,
            self.settings.reporting_timezone,
        )

    def horizon_curve(self, start: date | None, end: date | None) -> HorizonCurve:
        window = resolve_window(start, end, self.target_window)
        points = horizon_points(self.horizon_window(window), self.settings.max_horizon_h)
        return HorizonCurve(window=window, points=points)


@lru_cache(maxsize=1)
def get_desk() -> Desk:
    settings = get_settings()
    return Desk(get_store(), settings, load_catalog(settings.markets_file))
