from fastapi import APIRouter

from windesk.routers.params import DeskDependency
from windesk.schemas import MetaResponse

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/meta", response_model=MetaResponse)
def meta(desk: DeskDependency) -> MetaResponse:
    return desk.meta()
