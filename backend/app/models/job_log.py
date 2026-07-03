import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin
from app.models.enums import LogLevel

if TYPE_CHECKING:
    from app.models.job_execution import JobExecution


class JobLog(Base, UUIDMixin, TimestampMixin):
    """Append-only log line tied to a specific JobExecution."""

    __tablename__ = "job_logs"

    job_execution_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("job_executions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    log_level: Mapped[LogLevel] = mapped_column(
        SAEnum(LogLevel, name="log_level_enum", native_enum=True),
        default=LogLevel.INFO, nullable=False, index=True,
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)

    job_execution: Mapped["JobExecution"] = relationship("JobExecution", back_populates="logs")

    __table_args__ = (
        Index("ix_job_logs_execution_created", "job_execution_id", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<JobLog id={self.id} level={self.log_level}>"