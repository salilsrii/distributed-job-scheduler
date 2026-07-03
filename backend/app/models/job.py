import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.models.enums import JobStatus

if TYPE_CHECKING:
    from app.models.dead_letter_queue import DeadLetterQueue
    from app.models.job_execution import JobExecution
    from app.models.queue import Queue
    from app.models.retry_policy import RetryPolicy
    from app.models.scheduled_job import ScheduledJob
    from app.models.user import User


class Job(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "jobs"

    queue_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("queues.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    status: Mapped[JobStatus] = mapped_column(
        SAEnum(
            JobStatus,
            name="job_status_enum",
            native_enum=True,
            values_callable=lambda x: [e.value for e in x],
        ),
        default=JobStatus.PENDING,
        nullable=False,
        index=True,
    )

    priority: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_retries: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    timeout_seconds: Mapped[int] = mapped_column(Integer, default=300, nullable=False)

    queue: Mapped["Queue"] = relationship("Queue", back_populates="jobs")
    created_by_user: Mapped["User | None"] = relationship(
        "User",
        back_populates="jobs_created",
    )

    scheduled_jobs: Mapped[list["ScheduledJob"]] = relationship(
        "ScheduledJob",
        back_populates="job",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    retry_policy: Mapped["RetryPolicy | None"] = relationship(
        "RetryPolicy",
        back_populates="job",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    executions: Mapped[list["JobExecution"]] = relationship(
        "JobExecution",
        back_populates="job",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    dead_letter_entries: Mapped[list["DeadLetterQueue"]] = relationship(
        "DeadLetterQueue",
        back_populates="job",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        Index("ix_jobs_queue_status", "queue_id", "status"),
        Index("ix_jobs_priority", "priority"),
    )

    def __repr__(self) -> str:
        return f"<Job id={self.id} name={self.name!r} status={self.status}>"