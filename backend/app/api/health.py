from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/health")
async def health(request: Request):
    provider = request.app.state.llm_provider
    return {"status": "ok", "provider": provider.name}
