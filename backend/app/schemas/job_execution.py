"""
Pydantic schemas for the JobExecution resource.

Mirrors the shape of the SQLAlchemy JobExecution model:
  - job_id (FK → jobs)
  - worker_id (optional FK → workers)
  - status (ExecutionStatus enum, default RUNNING)
  - attempt_number (default 1, ge=1)
  - started_at (optional timestamp)
  - finished_at (optional timestamp)
  - result (optional JSON dictionary)
  - error_message (optional text)
"""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ExecutionStatus


class JobExecutionCreate(BaseModel):
    job_id: UUID
    worker_id: UUID | None = None
    status: ExecutionStatus = ExecutionStatus.RUNNING
    attempt_number: int = Field(default=1, ge=1)
    started_at: datetime | None = None
    finished_at: datetime | None = None
    result: dict[str, Any] | None = None
    error_message: str | None = None


class JobExecutionUpdate(BaseModel):
    worker_id: UUID | None = None
    status: ExecutionStatus | None = None
    attempt_number: int | None = Field(default=None, ge=1)
    started_at: datetime | None = None
    finished_at: datetime | None = None
    result: dict[str, Any] | None = None
    error_message: str | None = None


class JobExecutionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    job_id: UUID
    worker_id: UUID | None = None
    status: ExecutionStatus
    attempt_number: int
    started_at: datetime | None = None
    finished_at: datetime | None = None
    result: dict[str, Any] | None = None
    error_message: str | None = None
