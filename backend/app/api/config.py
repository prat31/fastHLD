import os
from fastapi import APIRouter

router = APIRouter()


@router.get("/config")
async def get_config():
    key = os.getenv("OPENAI_API_KEY", "")
    # Require a real key (real OpenAI keys are 50+ chars); reject empty or placeholder values
    return {"whisper_available": len(key) > 20}
