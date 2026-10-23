from fastapi import APIRouter

from windesk.routers import accuracy, decisions, markets, meta

router = APIRouter(prefix="/api/v1")
for resource in (meta, markets, decisions, accuracy):
    router.include_router(resource.router)
