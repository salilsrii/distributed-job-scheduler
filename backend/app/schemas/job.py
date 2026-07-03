"""
Pydantic schemas for the Job resource.

Mirrors the shape of the SQLAlchemy Job model:
  - queue_id (FK → queues)
  - created_by (FK → users, optional)
  - name
  - description (optional)
  - payload (default empty dict)
  - status (JobStatus enum)
  - priority (default 0)
  - max_retries (default 3)
  - timeout_seconds (default 300)
"""

from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import JobStatus


class JobCreate(BaseModel):
    queue_id: UUID
    created_by: UUID | None = None

    name: str
    description: str | None = None

    payload: dict = Field(default_factory=dict)

    priority: int = 0
    max_retries: int = 3
    timeout_seconds: int = 300


class JobUpdate(BaseModel):
    name: str | None = None
    description: str | None = None

    payload: dict | None = None

    status: JobStatus | None = None

    priority: int | None = None
    max_retries: int | None = None
    timeout_seconds: int | None = None


class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID

    queue_id: UUID
    created_by: UUID | None = None

    name: str
    description: str | None = None

    payload: dict

    status: JobStatus

    priority: int
    max_retries: int
    timeout_seconds: int