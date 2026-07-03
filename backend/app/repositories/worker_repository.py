import uuid
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import WorkerStatus
from app.models.worker import Worker
from app.repositories.base import SoftDeleteRepository


class WorkerRepository(SoftDeleteRepository[Worker]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Worker, session)

    async def list_by_organization(self, organization_id: uuid.UUID) -> Sequence[Worker]:
        result = await self.session.execute(
            select(Worker).where(Worker.organization_id == organization_id, Worker.is_deleted.is_(False))
        )
        return result.scalars().all()

    async def list_online(self, organization_id: uuid.UUID) -> Sequence[Worker]:
        result = await self.session.execute(
            select(Worker).where(
                Worker.organization_id == organization_id,
                Worker.status == WorkerStatus.ONLINE,
                Worker.is_deleted.is_(False),
            )
        )
        return result.scalars().all()