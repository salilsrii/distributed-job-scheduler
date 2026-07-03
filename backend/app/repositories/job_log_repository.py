"""
Job log repository.

Extends BaseRepository with job-log-specific queries
that mirror the patterns used across other repositories.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job_log import JobLog
from app.repositories.base import BaseRepository


class JobLogRepository(BaseRepository[JobLog]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(JobLog, session)

    async def list_all(self) -> list[JobLog]:
        result = await self.session.execute(
            select(JobLog).order_by(JobLog.created_at.desc())
        )
        return result.scalars().all()

    async def list_by_execution(
        self,
        job_execution_id: uuid.UUID,
    ) -> list[JobLog]:
        result = await self.session.execute(
            select(JobLog)
            .where(JobLog.job_execution_id == job_execution_id)
            .order_by(JobLog.created_at.asc())
        )
        return result.scalars().all()