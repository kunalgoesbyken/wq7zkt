from fastapi import APIRouter

from windesk.routers.params import DeskDependency
from windesk.schemas import MarketsResponse

router = APIRouter()


@router.get("/markets", response_model=MarketsResponse)
def markets(desk: DeskDependency) -> MarketsResponse:
    return desk.catalog
