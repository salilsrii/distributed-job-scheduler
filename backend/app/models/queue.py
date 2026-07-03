import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.job import Job
    from app.models.project import Project


class Queue(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "queues"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    max_concurrency: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    project: Mapped["Project"] = relationship("Project", back_populates="queues")
    jobs: Mapped[list["Job"]] = relationship(
        "Job", back_populates="queue", cascade="all, delete-orphan", passive_deletes=True
    )

    __table_args__ = (
        Index("ix_queues_project_name", "project_id", "name", unique=True),
    )

    def __repr__(self) -> str:
        return f"<Queue id={self.id} name={self.name!r}>"