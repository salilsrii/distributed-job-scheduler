import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.job import Job


class ScheduledJob(Base, UUIDMixin, TimestampMixin):
    """
    Represents a recurring (cron-based) schedule attached to a Job.
    No soft delete — schedules are removed via cascade or deactivated
    via `is_active` instead.
    """

    __tablename__ = "scheduled_jobs"

    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    cron_expression: Mapped[str] = mapped_column(String(120), nullable=False)
    next_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    last_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    job: Mapped["Job"] = relationship("Job", back_populates="scheduled_jobs")

    __table_args__ = (
        Index("ix_scheduled_jobs_active_next_run", "is_active", "next_run_at"),
    )

    def __repr__(self) -> str:
        return f"<ScheduledJob id={self.id} job_id={self.job_id} cron={self.cron_expression!r}>"