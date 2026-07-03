import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin
from app.models.enums import BackoffStrategy

if TYPE_CHECKING:
    from app.models.job import Job


class RetryPolicy(Base, UUIDMixin, TimestampMixin):
    """One-to-one retry configuration per Job."""

    __tablename__ = "retry_policies"

    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False, unique=True, index=True,
    )
    max_retries: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    backoff_strategy: Mapped[BackoffStrategy] = mapped_column(
        SAEnum(BackoffStrategy, name="backoff_strategy_enum", native_enum=True),
        default=BackoffStrategy.EXPONENTIAL, nullable=False,
    )
    backoff_seconds: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    max_backoff_seconds: Mapped[int] = mapped_column(Integer, default=3600, nullable=False)

    job: Mapped["Job"] = relationship("Job", back_populates="retry_policy")

    def __repr__(self) -> str:
        return f"<RetryPolicy id={self.id} job_id={self.job_id} strategy={self.backoff_strategy}>"