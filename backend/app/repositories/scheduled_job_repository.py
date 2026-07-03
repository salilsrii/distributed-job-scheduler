import uuid
from datetime import datetime
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.scheduled_job import ScheduledJob
from app.repositories.base import BaseRepository


class ScheduledJobRepository(BaseRepository[ScheduledJob]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(ScheduledJob, session)

    async def list_by_job(self, job_id: uuid.UUID) -> Sequence[ScheduledJob]:
        result = await self.session.execute(select(ScheduledJob).where(ScheduledJob.job_id == job_id))
        return result.scalars().all()

    async def list_due(self, *, as_of: datetime, limit: int = 100) -> Sequence[ScheduledJob]:
        """Schedules that are active and due to run at or before `as_of`."""
        result = await self.session.execute(
            select(ScheduledJob)
            .where(
                ScheduledJob.is_active.is_(True),
                ScheduledJob.next_run_at.isnot(None),
                ScheduledJob.next_run_at <= as_of,
            )
            .limit(limit)
        )
        return result.scalars().all()