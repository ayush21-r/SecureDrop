"""Central API router uniting all versioned endpoints."""
from fastapi import APIRouter
from app.api.v1.endpoints.health import router as health_router

api_router = APIRouter()

# Include version 1 endpoints
api_router.include_router(health_router, prefix="/v1", tags=["health"])

# Also include health directly at /api/health as requested in specification
api_router.include_router(health_router, tags=["health"])
