import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Enum as SAEnum
from sqlalchemy import DateTime, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.models.enums import WorkerStatus

if TYPE_CHECKING:
    from app.models.job_execution import JobExecution
    from app.models.organization import Organization
    from app.models.worker_heartbeat import WorkerHeartbeat


class Worker(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "workers"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    hostname: Mapped[str] = mapped_column(String(255), nullable=False)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    status: Mapped[WorkerStatus] = mapped_column(
        SAEnum(WorkerStatus, name="worker_status_enum", native_enum=True),
        default=WorkerStatus.OFFLINE, nullable=False, index=True,
    )
    capabilities: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    organization: Mapped["Organization"] = relationship("Organization", back_populates="workers")
    heartbeats: Mapped[list["WorkerHeartbeat"]] = relationship(
        "WorkerHeartbeat", back_populates="worker", cascade="all, delete-orphan", passive_deletes=True
    )
    executions: Mapped[list["JobExecution"]] = relationship(
        "JobExecution", back_populates="worker", passive_deletes=True
    )

    __table_args__ = (
        Index("ix_workers_org_hostname", "organization_id", "hostname"),
    )

    def __repr__(self) -> str:
        return f"<Worker id={self.id} hostname={self.hostname!r} status={self.status}>"