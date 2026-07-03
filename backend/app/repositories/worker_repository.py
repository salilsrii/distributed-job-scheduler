"""
Worker repository.

Extends SoftDeleteRepository with worker-specific queries
that mirror the patterns used by OrganizationRepository,
ProjectRepository, QueueRepository, and JobRepository.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.worker import Worker
from app.repositories.base import SoftDeleteRepository


class WorkerRepository(SoftDeleteRepository[Worker]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Worker, session)

    async def list_by_organization(
        self,
        organization_id: uuid.UUID,
    ) -> list[Worker]:
        result = await self.session.execute(
            select(Worker).where(
                Worker.organization_id == organization_id,
                Worker.is_deleted.is_(False),
            )
        )
        return result.scalars().all()

    async def get_by_hostname(
        self,
        organization_id: uuid.UUID,
        hostname: str,
    ) -> Worker | None:
        result = await self.session.execute(
            select(Worker).where(
                Worker.organization_id == organization_id,
                Worker.hostname == hostname,
                Worker.is_deleted.is_(False),
            )
        )
        return result.scalar_one_or_none()