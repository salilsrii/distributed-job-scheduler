"""
Worker heartbeat repository.

Extends BaseRepository with worker-heartbeat-specific queries
that mirror the patterns used across other repositories.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.worker_heartbeat import WorkerHeartbeat
from app.repositories.base import BaseRepository


class WorkerHeartbeatRepository(BaseRepository[WorkerHeartbeat]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(WorkerHeartbeat, session)

    async def list_all(self) -> list[WorkerHeartbeat]:
        result = await self.session.execute(
            select(WorkerHeartbeat).order_by(WorkerHeartbeat.created_at.desc())
        )
        return result.scalars().all()

    async def list_by_worker(
        self,
        worker_id: uuid.UUID,
    ) -> list[WorkerHeartbeat]:
        result = await self.session.execute(
            select(WorkerHeartbeat)
            .where(WorkerHeartbeat.worker_id == worker_id)
            .order_by(WorkerHeartbeat.created_at.desc())
        )
        return result.scalars().all()