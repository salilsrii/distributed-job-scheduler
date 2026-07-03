import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.job import Job
    from app.models.job_execution import JobExecution


class DeadLetterQueue(Base, UUIDMixin, TimestampMixin):
    """Terminal record for jobs that exhausted retries."""

    __tablename__ = "dead_letter_queue"

    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    job_execution_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("job_executions.id", ondelete="SET NULL"), nullable=True, unique=True
    )
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    payload_snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    failed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    job: Mapped["Job"] = relationship("Job", back_populates="dead_letter_entries")
    job_execution: Mapped["JobExecution | None"] = relationship(
        "JobExecution", back_populates="dead_letter_entry"
    )

    __table_args__ = (
        Index("ix_dlq_job_failed_at", "job_id", "failed_at"),
    )

    def __repr__(self) -> str:
        return f"<DeadLetterQueue id={self.id} job_id={self.job_id}>"