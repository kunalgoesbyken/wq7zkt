from datetime import date

from fastapi import APIRouter

from windesk.routers.params import ERROR_RESPONSES, DeskDependency, EndDate, MarketId, StartDate
from windesk.schemas import DecisionCalendar, DecisionDay

router = APIRouter(prefix="/decisions", responses=ERROR_RESPONSES)


@router.get("", response_model=DecisionCalendar)
def decision_calendar(
    desk: DeskDependency, market_id: MarketId = None, start: StartDate = None, end: EndDate = None
) -> DecisionCalendar:
    return desk.calendar(market_id, start, end)


@router.get("/{delivery_date}", response_model=DecisionDay)
def decision_day(desk: DeskDependency, delivery_date: date, market_id: MarketId = None) -> DecisionDay:
    return desk.decision_day(market_id, delivery_date)
