import io
import os

from fastapi import APIRouter, File, HTTPException, UploadFile
from openai import AsyncOpenAI

router = APIRouter()


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Whisper unavailable: OPENAI_API_KEY not set")

    audio_bytes = await file.read()
    client = AsyncOpenAI(api_key=api_key)

    try:
        result = await client.audio.transcriptions.create(
            model="whisper-1",
            file=(file.filename or "audio.webm", io.BytesIO(audio_bytes), file.content_type or "audio/webm"),
        )
        return {"transcript": result.text}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {exc}") from exc
