import uuid
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.queue import Queue
from app.repositories.base import SoftDeleteRepository


class QueueRepository(SoftDeleteRepository[Queue]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Queue, session)

    async def list_by_project(self, project_id: uuid.UUID) -> Sequence[Queue]:
        result = await self.session.execute(
            select(Queue).where(Queue.project_id == project_id, Queue.is_deleted.is_(False))
        )
        return result.scalars().all()