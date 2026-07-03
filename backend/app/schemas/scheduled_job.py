"""
Pydantic schemas for the ScheduledJob resource.

Mirrors the shape of the SQLAlchemy ScheduledJob model:
  - job_id (FK → jobs)
  - cron_expression (string representation of schedule)
  - next_run_at (optional timestamp)
  - last_run_at (optional timestamp)
  - is_active (boolean flag)
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ScheduledJobCreate(BaseModel):
    job_id: UUID
    cron_expression: str = Field(..., min_length=1, max_length=120)
    next_run_at: datetime | None = None
    is_active: bool = True


class ScheduledJobUpdate(BaseModel):
    cron_expression: str | None = Field(default=None, min_length=1, max_length=120)
    next_run_at: datetime | None = None
    last_run_at: datetime | None = None
    is_active: bool | None = None


class ScheduledJobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    job_id: UUID
    cron_expression: str
    next_run_at: datetime | None = None
    last_run_at: datetime | None = None
    is_active: bool
