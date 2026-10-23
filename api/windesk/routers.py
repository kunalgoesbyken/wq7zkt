from datetime import date
from typing import Annotated

from fastapi import APIRouter, Query

from windesk.schemas import (
    AccuracyReport,
    Basis,
    DecisionCalendar,
    DecisionDay,
    HorizonCurve,
    MarketsResponse,
    MetaResponse,
)

router = APIRouter(prefix="/api/v1")

MarketId = Annotated[str | None, Query(alias="market")]
StartDate = Annotated[date | None, Query()]
EndDate = Annotated[date | None, Query()]


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/meta", response_model=MetaResponse)
def meta() -> MetaResponse:
    raise NotImplementedError


@router.get("/markets", response_model=MarketsResponse)
def markets() -> MarketsResponse:
    raise NotImplementedError


@router.get("/decisions", response_model=DecisionCalendar)
def decision_calendar(market_id: MarketId = None, start: StartDate = None, end: EndDate = None) -> DecisionCalendar:
    raise NotImplementedError


@router.get("/decisions/{delivery_date}", response_model=DecisionDay)
def decision_day(delivery_date: date, market_id: MarketId = None) -> DecisionDay:
    raise NotImplementedError


@router.get("/accuracy", response_model=AccuracyReport)
def accuracy(
    basis: Basis = Basis.HORIZON,
    horizon_h: Annotated[int, Query(ge=0, le=48)] = 24,
    market_id: MarketId = None,
    start: StartDate = None,
    end: EndDate = None,
) -> AccuracyReport:
    raise NotImplementedError


@router.get("/accuracy/horizon-curve", response_model=HorizonCurve)
def horizon_curve(start: StartDate = None, end: EndDate = None) -> HorizonCurve:
    raise NotImplementedError
