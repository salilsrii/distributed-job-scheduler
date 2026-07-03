"""
Pydantic schemas for the WorkerHeartbeat resource.

Mirrors the shape of the SQLAlchemy WorkerHeartbeat model:
  - worker_id (FK → workers)
  - status (WorkerStatus enum)
  - cpu_usage (optional float)
  - memory_usage (optional float)
  - created_at (timestamp of heartbeat)
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import WorkerStatus


class WorkerHeartbeatCreate(BaseModel):
    worker_id: UUID
    status: WorkerStatus = WorkerStatus.ONLINE
    cpu_usage: float | None = Field(default=None, ge=0.0, le=100.0)
    memory_usage: float | None = Field(default=None, ge=0.0, le=100.0)


class WorkerHeartbeatUpdate(BaseModel):
    status: WorkerStatus | None = None
    cpu_usage: float | None = Field(default=None, ge=0.0, le=100.0)
    memory_usage: float | None = Field(default=None, ge=0.0, le=100.0)


class WorkerHeartbeatResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    worker_id: UUID
    status: WorkerStatus
    cpu_usage: float | None = None
    memory_usage: float | None = None
    created_at: datetime
