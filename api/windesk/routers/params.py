from datetime import date
from typing import Annotated, Any

from fastapi import Depends, Query

from windesk.desk import Desk, get_desk
from windesk.schemas import ErrorBody

DeskDependency = Annotated[Desk, Depends(get_desk)]
MarketId = Annotated[str | None, Query(alias="market")]
StartDate = Annotated[date | None, Query()]
EndDate = Annotated[date | None, Query()]
ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {404: {"model": ErrorBody}, 422: {"model": ErrorBody}}
