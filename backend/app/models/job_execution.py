import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Enum as SAEnum
from sqlalchemy import DateTime, ForeignKey, Index, Integer, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin
from app.models.enums import ExecutionStatus

if TYPE_CHECKING:
    from app.models.dead_letter_queue import DeadLetterQueue
    from app.models.job import Job
    from app.models.job_log import JobLog
    from app.models.worker import Worker


class JobExecution(Base, UUIDMixin, TimestampMixin):
    """
    A single attempt to run a Job. No soft delete — execution
    history is immutable and cascades from its parent Job.
    """

    __tablename__ = "job_executions"

    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    worker_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workers.id", ondelete="SET NULL"), nullable=True, index=True
    )
    status: Mapped[ExecutionStatus] = mapped_column(
        SAEnum(ExecutionStatus, name="execution_status_enum", native_enum=True),
        default=ExecutionStatus.RUNNING, nullable=False, index=True,
    )
    attempt_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    result: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    job: Mapped["Job"] = relationship("Job", back_populates="executions")
    worker: Mapped["Worker | None"] = relationship("Worker", back_populates="executions")
    logs: Mapped[list["JobLog"]] = relationship(
        "JobLog", back_populates="job_execution", cascade="all, delete-orphan", passive_deletes=True
    )
    dead_letter_entry: Mapped["DeadLetterQueue | None"] = relationship(
        "DeadLetterQueue", back_populates="job_execution", uselist=False, passive_deletes=True
    )

    __table_args__ = (
        Index("ix_job_executions_job_attempt", "job_id", "attempt_number"),
        Index("ix_job_executions_worker_status", "worker_id", "status"),
    )

    def __repr__(self) -> str:
        return f"<JobExecution id={self.id} job_id={self.job_id} status={self.status}>"