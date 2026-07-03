from typing import TYPE_CHECKING

from sqlalchemy import Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.project import Project
    from app.models.user import User
    from app.models.worker import Worker


class Organization(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)

    users: Mapped[list["User"]] = relationship(
        "User", back_populates="organization", cascade="all, delete-orphan", passive_deletes=True
    )
    projects: Mapped[list["Project"]] = relationship(
        "Project", back_populates="organization", cascade="all, delete-orphan", passive_deletes=True
    )
    workers: Mapped[list["Worker"]] = relationship(
        "Worker", back_populates="organization", cascade="all, delete-orphan", passive_deletes=True
    )

    __table_args__ = (
        Index("ix_organizations_name_not_deleted", "name", "is_deleted"),
    )

    def __repr__(self) -> str:
        return f"<Organization id={self.id} name={self.name!r}>"