"""
Pydantic schemas for the JobLog resource.

Mirrors the shape of the SQLAlchemy JobLog model:
  - job_execution_id (FK → job_executions)
  - log_level (LogLevel enum, default INFO)
  - message (log text)
  - created_at (timestamp of log entry)
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import LogLevel


class JobLogCreate(BaseModel):
    job_execution_id: UUID
    log_level: LogLevel = LogLevel.INFO
    message: str = Field(..., min_length=1)


class JobLogUpdate(BaseModel):
    log_level: LogLevel | None = None
    message: str | None = Field(default=None, min_length=1)


class JobLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    job_execution_id: UUID
    log_level: LogLevel
    message: str
    created_at: datetime
