"""
Job execution repository.

Extends BaseRepository with job-execution-specific queries
that mirror the patterns used across other repositories.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job_execution import JobExecution
from app.repositories.base import BaseRepository


class JobExecutionRepository(BaseRepository[JobExecution]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(JobExecution, session)

    async def list_all(self) -> list[JobExecution]:
        result = await self.session.execute(
            select(JobExecution).order_by(JobExecution.created_at.desc())
        )
        return result.scalars().all()

    async def list_by_job(
        self,
        job_id: uuid.UUID,
    ) -> list[JobExecution]:
        result = await self.session.execute(
            select(JobExecution)
            .where(JobExecution.job_id == job_id)
            .order_by(JobExecution.attempt_number.desc())
        )
        return result.scalars().all()

    async def list_by_worker(
        self,
        worker_id: uuid.UUID,
    ) -> list[JobExecution]:
        result = await self.session.execute(
            select(JobExecution)
            .where(JobExecution.worker_id == worker_id)
            .order_by(JobExecution.created_at.desc())
        )
        return result.scalars().all()

    async def get_by_job_and_attempt(
        self,
        job_id: uuid.UUID,
        attempt_number: int,
    ) -> JobExecution | None:
        result = await self.session.execute(
            select(JobExecution).where(
                JobExecution.job_id == job_id,
                JobExecution.attempt_number == attempt_number,
            )
        )
        return result.scalar_one_or_none()