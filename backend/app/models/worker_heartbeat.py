import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum as SAEnum
from sqlalchemy import Float, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin
from app.models.enums import WorkerStatus

if TYPE_CHECKING:
    from app.models.worker import Worker


class WorkerHeartbeat(Base, UUIDMixin, TimestampMixin):
    """
    Append-only heartbeat log. `created_at` (from TimestampMixin)
    doubles as the heartbeat timestamp — no separate field needed,
    no soft delete (history is immutable).
    """

    __tablename__ = "worker_heartbeats"

    worker_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[WorkerStatus] = mapped_column(
        SAEnum(WorkerStatus, name="worker_status_enum", native_enum=True, create_type=False),
        nullable=False,
    )
    cpu_usage: Mapped[float | None] = mapped_column(Float, nullable=True)
    memory_usage: Mapped[float | None] = mapped_column(Float, nullable=True)

    worker: Mapped["Worker"] = relationship("Worker", back_populates="heartbeats")

    __table_args__ = (
        Index("ix_worker_heartbeats_worker_created", "worker_id", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<WorkerHeartbeat id={self.id} worker_id={self.worker_id}>"