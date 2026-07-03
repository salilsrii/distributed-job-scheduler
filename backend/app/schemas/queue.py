"""
Pydantic schemas for the Queue resource.

Mirrors the shape of the SQLAlchemy Queue model:
  - project_id (FK → projects)
  - name
  - description (optional)
  - max_concurrency (default 1)
"""

from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class QueueCreate(BaseModel):
    project_id: UUID
    name: str
    description: str | None = None
    max_concurrency: int = Field(default=1, ge=1)


class QueueUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    max_concurrency: int | None = Field(default=None, ge=1)


class QueueResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    name: str
    description: str | None = None
    max_concurrency: int
