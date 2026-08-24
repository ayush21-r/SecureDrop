"""Health check endpoint router."""
from fastapi import APIRouter
from app.schemas.health import HealthResponse
from app.core.config import settings

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health Check",
    description="Returns the current operating health of the SecureDrop API.",
)
async def get_health() -> HealthResponse:
    """Check API operational health status."""
    return HealthResponse(
        status="ok",
        service=settings.PROJECT_NAME,
    )
