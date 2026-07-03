import uuid
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dead_letter_queue import DeadLetterQueue
from app.repositories.base import BaseRepository


class DeadLetterQueueRepository(BaseRepository[DeadLetterQueue]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(DeadLetterQueue, session)

    async def list_by_job(self, job_id: uuid.UUID) -> Sequence[DeadLetterQueue]:
        result = await self.session.execute(select(DeadLetterQueue).where(DeadLetterQueue.job_id == job_id))
        return result.scalars().all()