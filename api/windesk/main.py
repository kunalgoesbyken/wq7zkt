from collections.abc import Awaitable, Callable
from http import HTTPMethod, HTTPStatus

from fastapi import FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from windesk.errors import DeskError
from windesk.routers import router
from windesk.schemas import ErrorBody
from windesk.settings import Settings, get_settings

INVALID_REQUEST = "INVALID_REQUEST"
CallNext = Callable[[Request], Awaitable[Response]]


def error_response(status: HTTPStatus, code: str, detail: str) -> JSONResponse:
    return JSONResponse(status_code=status, content=ErrorBody(code=code, detail=detail).model_dump())


async def desk_error_handler(_: Request, error: DeskError) -> JSONResponse:
    return error_response(error.status, error.code, error.detail)


async def validation_error_handler(_: Request, error: RequestValidationError) -> JSONResponse:
    detail = "; ".join(f"{'.'.join(map(str, issue['loc']))}: {issue['msg']}" for issue in error.errors())
    return error_response(HTTPStatus.UNPROCESSABLE_ENTITY, INVALID_REQUEST, detail)


def cache_headers(settings: Settings) -> Callable[[Request, CallNext], Awaitable[Response]]:
    async def apply(request: Request, call_next: CallNext) -> Response:
        response = await call_next(request)
        if request.method == HTTPMethod.GET and response.status_code == HTTPStatus.OK:
            response.headers["Cache-Control"] = settings.cache_control
        return response

    return apply


def create_app(settings: Settings) -> FastAPI:
    application = FastAPI(title="Wind Decision Desk API", version="1.0.0")
    application.include_router(router)
    application.add_exception_handler(DeskError, desk_error_handler)
    application.add_exception_handler(RequestValidationError, validation_error_handler)
    application.middleware("http")(cache_headers(settings))
    return application


app = create_app(get_settings())
