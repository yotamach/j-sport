import threading
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app import scheduler
from app.config import get_settings
from app.routers import auth, courts, users


@asynccontextmanager
async def lifespan(_: FastAPI):
    stop = threading.Event()
    if get_settings().scheduler_enabled:
        scheduler.start(stop)
    yield
    stop.set()


app = FastAPI(title="Jsport API", version="0.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(courts.router)

media = Path(get_settings().media_dir)
media.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=media), name="media")


@app.get("/health", tags=["meta"])
def health() -> dict:
    return {"ok": True}
