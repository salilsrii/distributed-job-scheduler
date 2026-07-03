import uuid
from typing import Sequence

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job_execution import JobExecution
from app.repositories.base import BaseRepository


class JobExecutionRepository(BaseRepository[JobExecution]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(JobExecution, session)

    async def list_by_job(self, job_id: uuid.UUID) -> Sequence[JobExecution]:
        result = await self.session.execute(
            select(JobExecution).where(JobExecution.job_id == job_id).order_by(JobExecution.attempt_number)
        )
        return result.scalars().all()

    async def get_latest_for_job(self, job_id: uuid.UUID) -> JobExecution | None:
        result = await self.session.execute(
            select(JobExecution)
            .where(JobExecution.job_id == job_id)
            .order_by(desc(JobExecution.attempt_number))
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def list_by_worker(self, worker_id: uuid.UUID, *, limit: int = 100) -> Sequence[JobExecution]:
        result = await self.session.execute(
            select(JobExecution).where(JobExecution.worker_id == worker_id).limit(limit)
        )
        return result.scalars().all()