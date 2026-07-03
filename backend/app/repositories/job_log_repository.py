import uuid
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job_log import JobLog
from app.repositories.base import BaseRepository


class JobLogRepository(BaseRepository[JobLog]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(JobLog, session)

    async def list_by_execution(self, job_execution_id: uuid.UUID, *, limit: int = 500) -> Sequence[JobLog]:
        result = await self.session.execute(
            select(JobLog)
            .where(JobLog.job_execution_id == job_execution_id)
            .order_by(JobLog.created_at)
            .limit(limit)
        )
        return result.scalars().all()