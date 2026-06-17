import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from app.llm.factory import get_provider
from app.api import health, diagram


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.llm_provider = get_provider()
    yield


app = FastAPI(title="fastHLD", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CORS_ORIGIN", "http://localhost:5173")],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(diagram.router, prefix="/api")
