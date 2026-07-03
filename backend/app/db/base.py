"""
SQLAlchemy declarative base and shared mixins.

All models inherit Base plus the mixins they need (UUID PK,
timestamps, soft delete). Kept here to avoid circular imports
between models and the engine/session setup.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


class UUIDMixin:
    """Provides a UUID primary key, generated application-side."""

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False,
    )


class TimestampMixin:
    """Provides created_at / updated_at audit columns."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class SoftDeleteMixin:
    """
    Provides soft-delete support. Applied only to models where
    logical deletion (rather than hard delete) makes sense —
    Organizations, Users, Projects, Queues, Jobs, Workers.
    """

    is_deleted: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False, index=True
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )