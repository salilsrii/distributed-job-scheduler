import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.queue import Queue


class Project(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "projects"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    organization: Mapped["Organization"] = relationship("Organization", back_populates="projects")
    queues: Mapped[list["Queue"]] = relationship(
        "Queue", back_populates="project", cascade="all, delete-orphan", passive_deletes=True
    )

    __table_args__ = (
        Index("ix_projects_org_name", "organization_id", "name", unique=True),
    )

    def __repr__(self) -> str:
        return f"<Project id={self.id} name={self.name!r}>"