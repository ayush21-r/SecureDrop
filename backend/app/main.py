"""FastAPI application entry point for SecureDrop backend."""
import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="SecureDrop Backend API with Hybrid Cryptography support.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware Configuration
# Configured via ALLOWED_ORIGINS environment variable for production readiness
origins = settings.ALLOWED_ORIGINS
if isinstance(origins, str):
    origins = [o.strip() for o in origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers under /api
app.include_router(api_router, prefix="/api")


@app.get("/", tags=["root"])
async def root():
    """Root entry point with service metadata."""
    return {
        "service": settings.PROJECT_NAME,
        "status": "online",
        "docs": "/docs",
        "health": "/api/health",
    }


if __name__ == "__main__":
    # Support Render / Cloud dynamic PORT assignment
    port = int(os.environ.get("PORT", settings.PORT))
    host = os.environ.get("HOST", settings.HOST)
    uvicorn.run("app.main:app", host=host, port=port, reload=settings.DEBUG)
