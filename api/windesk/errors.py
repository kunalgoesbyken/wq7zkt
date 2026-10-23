from http import HTTPStatus


class DeskError(Exception):
    def __init__(self, status: HTTPStatus, code: str, detail: str) -> None:
        super().__init__(detail)
        self.status = status
        self.code = code
        self.detail = detail


def unknown_market(market_id: str) -> DeskError:
    return DeskError(HTTPStatus.NOT_FOUND, "UNKNOWN_MARKET", f"market '{market_id}' is not configured")


def out_of_window(requested: object, start: object, end: object) -> DeskError:
    return DeskError(HTTPStatus.UNPROCESSABLE_ENTITY, "OUT_OF_WINDOW", f"{requested} is outside {start}..{end}")


def invalid_range(start: object, end: object) -> DeskError:
    return DeskError(HTTPStatus.UNPROCESSABLE_ENTITY, "INVALID_RANGE", f"start {start} is after end {end}")
