from fastapi import FastAPI

from windesk.routers import router

app = FastAPI(title="Wind Decision Desk API", version="1.0.0")
app.include_router(router)
