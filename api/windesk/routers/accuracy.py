from typing import Annotated

from fastapi import APIRouter, Query

from windesk.routers.params import ERROR_RESPONSES, DeskDependency, EndDate, MarketId, StartDate
from windesk.schemas import AccuracyReport, Basis, HorizonCurve
from windesk.settings import get_settings

router = APIRouter(prefix="/accuracy", responses=ERROR_RESPONSES)

SETTINGS = get_settings()
HorizonHours = Annotated[int, Query(ge=0, le=SETTINGS.max_horizon_h)]


@router.get("", response_model=AccuracyReport)
def accuracy(
    desk: DeskDependency,
    basis: Basis = Basis.HORIZON,
    horizon_h: HorizonHours = SETTINGS.default_horizon_h,
    market_id: MarketId = None,
    start: StartDate = None,
    end: EndDate = None,
) -> AccuracyReport:
    return desk.accuracy(basis, horizon_h, market_id, start, end)


@router.get("/horizon-curve", response_model=HorizonCurve)
def horizon_curve(desk: DeskDependency, start: StartDate = None, end: EndDate = None) -> HorizonCurve:
    return desk.horizon_curve(start, end)
