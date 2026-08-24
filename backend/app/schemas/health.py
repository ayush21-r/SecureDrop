"""Health check response schema."""
from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Schema for service health check response."""
    status: str
    service: str
