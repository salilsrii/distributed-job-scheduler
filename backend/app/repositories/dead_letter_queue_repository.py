"""
Dead letter queue repository.

Extends BaseRepository with dead-letter-queue-specific queries
that mirror the patterns used across other repositories.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dead_letter_queue import DeadLetterQueue
from app.repositories.base import BaseRepository


class DeadLetterQueueRepository(BaseRepository[DeadLetterQueue]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(DeadLetterQueue, session)

    async def list_all(self) -> list[DeadLetterQueue]:
        result = await self.session.execute(
            select(DeadLetterQueue).order_by(DeadLetterQueue.failed_at.desc())
        )
        return result.scalars().all()

    async def list_by_job(
        self,
        job_id: uuid.UUID,
    ) -> list[DeadLetterQueue]:
        result = await self.session.execute(
            select(DeadLetterQueue)
            .where(DeadLetterQueue.job_id == job_id)
            .order_by(DeadLetterQueue.failed_at.desc())
        )
        return result.scalars().all()

    async def get_by_execution(
        self,
        job_execution_id: uuid.UUID,
    ) -> DeadLetterQueue | None:
        result = await self.session.execute(
            select(DeadLetterQueue).where(
                DeadLetterQueue.job_execution_id == job_execution_id
            )
        )
        return result.scalar_one_or_none()