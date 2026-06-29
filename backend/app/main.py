from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.core.database import create_db_and_tables
from app.api import users, sessions, cube_events


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(
    title="Smart Cube Hub API",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(sessions.router, prefix="/api/v1/sessions", tags=["sessions"])
app.include_router(cube_events.router, prefix="/api/v1/cube-events", tags=["cube-events"])


@app.get("/health")
def health():
    return {"status": "ok"}
