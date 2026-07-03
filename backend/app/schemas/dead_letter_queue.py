"""
Pydantic schemas for the DeadLetterQueue resource.

Mirrors the shape of the SQLAlchemy DeadLetterQueue model:
  - job_id (FK → jobs)
  - job_execution_id (optional FK → job_executions)
  - reason (failure explanation)
  - payload_snapshot (snapshot of job payload at time of failure)
  - failed_at (timestamp of terminal failure)
"""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DeadLetterQueueCreate(BaseModel):
    job_id: UUID
    job_execution_id: UUID | None = None
    reason: str = Field(..., min_length=1)
    payload_snapshot: dict[str, Any] = Field(default_factory=dict)
    failed_at: datetime


class DeadLetterQueueUpdate(BaseModel):
    reason: str | None = Field(default=None, min_length=1)
    payload_snapshot: dict[str, Any] | None = None
    failed_at: datetime | None = None


class DeadLetterQueueResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    job_id: UUID
    job_execution_id: UUID | None = None
    reason: str
    payload_snapshot: dict[str, Any]
    failed_at: datetime
    created_at: datetime
