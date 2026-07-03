import uuid
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import JobStatus
from app.models.job import Job
from app.repositories.base import SoftDeleteRepository


class JobRepository(SoftDeleteRepository[Job]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Job, session)

    async def list_by_queue(self, queue_id: uuid.UUID) -> Sequence[Job]:
        result = await self.session.execute(
            select(Job).where(Job.queue_id == queue_id, Job.is_deleted.is_(False))
        )
        return result.scalars().all()

    async def list_by_status(self, status: JobStatus, *, limit: int = 100) -> Sequence[Job]:
        result = await self.session.execute(
            select(Job)
            .where(Job.status == status, Job.is_deleted.is_(False))
            .order_by(Job.priority.desc(), Job.created_at.asc())
            .limit(limit)
        )
        return result.scalars().all()

    async def list_pending(self, *, limit: int = 100) -> Sequence[Job]:
        return await self.list_by_status(JobStatus.PENDING, limit=limit)