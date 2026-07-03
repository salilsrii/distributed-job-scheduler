"""
Pydantic schemas for the Worker resource.

Mirrors the shape of the SQLAlchemy Worker model:
  - organization_id (FK → organizations)
  - hostname
  - ip_address (optional)
  - status (WorkerStatus enum, default OFFLINE)
  - capabilities (default empty dict)
  - last_seen_at (optional datetime)
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import WorkerStatus


class WorkerCreate(BaseModel):
    organization_id: UUID
    hostname: str
    ip_address: str | None = None
    status: WorkerStatus = WorkerStatus.OFFLINE
    capabilities: dict = Field(default_factory=dict)


class WorkerUpdate(BaseModel):
    hostname: str | None = None
    ip_address: str | None = None
    status: WorkerStatus | None = None
    capabilities: dict | None = None
    last_seen_at: datetime | None = None


class WorkerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    hostname: str
    ip_address: str | None = None
    status: WorkerStatus
    capabilities: dict
    last_seen_at: datetime | None = None
