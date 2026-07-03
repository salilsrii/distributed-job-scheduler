"""
Pydantic schemas for the RetryPolicy resource.

Mirrors the shape of the SQLAlchemy RetryPolicy model:
  - job_id (FK → jobs, unique)
  - max_retries (default 3, ge=0)
  - backoff_strategy (BackoffStrategy enum, default EXPONENTIAL)
  - backoff_seconds (default 5, ge=1)
  - max_backoff_seconds (default 3600, ge=1)
"""

from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import BackoffStrategy


class RetryPolicyCreate(BaseModel):
    job_id: UUID
    max_retries: int = Field(default=3, ge=0)
    backoff_strategy: BackoffStrategy = BackoffStrategy.EXPONENTIAL
    backoff_seconds: int = Field(default=5, ge=1)
    max_backoff_seconds: int = Field(default=3600, ge=1)


class RetryPolicyUpdate(BaseModel):
    max_retries: int | None = Field(default=None, ge=0)
    backoff_strategy: BackoffStrategy | None = None
    backoff_seconds: int | None = Field(default=None, ge=1)
    max_backoff_seconds: int | None = Field(default=None, ge=1)


class RetryPolicyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    job_id: UUID
    max_retries: int
    backoff_strategy: BackoffStrategy
    backoff_seconds: int
    max_backoff_seconds: int
