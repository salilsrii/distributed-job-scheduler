"""
Job repository.

Extends SoftDeleteRepository with job-specific queries
that mirror the patterns used by OrganizationRepository,
ProjectRepository, and QueueRepository.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job import Job
from app.repositories.base import SoftDeleteRepository


class JobRepository(SoftDeleteRepository[Job]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Job, session)

    async def list_by_queue(
        self,
        queue_id: uuid.UUID,
    ) -> list[Job]:
        result = await self.session.execute(
            select(Job).where(
                Job.queue_id == queue_id,
                Job.is_deleted.is_(False),
            )
        )
        return result.scalars().all()

    async def get_by_name(
        self,
        queue_id: uuid.UUID,
        name: str,
    ) -> Job | None:
        result = await self.session.execute(
            select(Job).where(
                Job.queue_id == queue_id,
                Job.name == name,
                Job.is_deleted.is_(False),
            )
        )
        return result.scalar_one_or_none()