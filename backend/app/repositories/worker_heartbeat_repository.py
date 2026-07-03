import uuid
from typing import Sequence

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.worker_heartbeat import WorkerHeartbeat
from app.repositories.base import BaseRepository


class WorkerHeartbeatRepository(BaseRepository[WorkerHeartbeat]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(WorkerHeartbeat, session)

    async def list_by_worker(self, worker_id: uuid.UUID, *, limit: int = 50) -> Sequence[WorkerHeartbeat]:
        result = await self.session.execute(
            select(WorkerHeartbeat)
            .where(WorkerHeartbeat.worker_id == worker_id)
            .order_by(desc(WorkerHeartbeat.created_at))
            .limit(limit)
        )
        return result.scalars().all()

    async def get_latest(self, worker_id: uuid.UUID) -> WorkerHeartbeat | None:
        result = await self.session.execute(
            select(WorkerHeartbeat)
            .where(WorkerHeartbeat.worker_id == worker_id)
            .order_by(desc(WorkerHeartbeat.created_at))
            .limit(1)
        )
        return result.scalar_one_or_none()