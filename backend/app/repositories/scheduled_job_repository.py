"""
Scheduled job repository.

Extends BaseRepository with scheduled-job-specific queries
that mirror the patterns used across other repositories.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.scheduled_job import ScheduledJob
from app.repositories.base import BaseRepository


class ScheduledJobRepository(BaseRepository[ScheduledJob]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(ScheduledJob, session)

    async def list_all(self) -> list[ScheduledJob]:
        result = await self.session.execute(
            select(ScheduledJob).order_by(ScheduledJob.created_at.desc())
        )
        return result.scalars().all()

    async def list_by_job(
        self,
        job_id: uuid.UUID,
    ) -> list[ScheduledJob]:
        result = await self.session.execute(
            select(ScheduledJob)
            .where(ScheduledJob.job_id == job_id)
            .order_by(ScheduledJob.created_at.desc())
        )
        return result.scalars().all()

    async def get_by_job_and_cron(
        self,
        job_id: uuid.UUID,
        cron_expression: str,
    ) -> ScheduledJob | None:
        result = await self.session.execute(
            select(ScheduledJob).where(
                ScheduledJob.job_id == job_id,
                ScheduledJob.cron_expression == cron_expression,
            )
        )
        return result.scalar_one_or_none()