import os
from fastapi import APIRouter

router = APIRouter()


@router.get("/config")
async def get_config():
    return {"whisper_available": bool(os.getenv("OPENAI_API_KEY"))}
