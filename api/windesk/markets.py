from datetime import date, datetime, time, timedelta
from functools import lru_cache
from pathlib import Path

from windesk.errors import unknown_market
from windesk.localtime import DAY, local_to_utc
from windesk.schemas import DateWindow, Market, MarketsResponse

HOUR = timedelta(hours=1)


@lru_cache
def load_catalog(path: Path) -> MarketsResponse:
    return MarketsResponse.model_validate_json(path.read_text(encoding="utf-8"))


def find_market(catalog: MarketsResponse, market_id: str | None) -> Market:
    wanted = market_id or catalog.default_market_id
    match = next((market for market in catalog.markets if market.id == wanted), None)
    if match is None:
        raise unknown_market(wanted)
    return match


def gate_closure_utc(market: Market, delivery_date: date) -> datetime:
    auction_date = delivery_date - DAY * market.gate_closure_days_before
    return local_to_utc(auction_date, time.fromisoformat(market.gate_closure_local), market.timezone)


def delivery_bounds(market: Market, delivery_date: date) -> tuple[datetime, datetime]:
    delivery_start = time.fromisoformat(market.delivery_start_local)
    start = local_to_utc(delivery_date - DAY, delivery_start, market.timezone)
    end = local_to_utc(delivery_date, delivery_start, market.timezone)
    return start, end


def delivery_hours(market: Market, delivery_date: date) -> list[datetime]:
    start, end = delivery_bounds(market, delivery_date)
    return [start + HOUR * index for index in range((end - start) // HOUR)]


def delivery_window(market: Market, auction_window: DateWindow) -> DateWindow:
    offset = DAY * market.gate_closure_days_before
    return DateWindow(start=auction_window.start + offset, end=auction_window.end + offset)
