"""
Queue service.

Orchestrates business logic for queue CRUD, delegating all
persistence to QueueRepository. Follows the same pattern as
OrganizationService and ProjectService.
"""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.queue_repository import QueueRepository
from app.schemas.queue import QueueCreate, QueueUpdate


class QueueService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = QueueRepository(session)

    async def create(self, data: QueueCreate):
        queue = await self.repo.create(
            project_id=data.project_id,
            name=data.name,
            description=data.description,
            max_concurrency=data.max_concurrency,
        )

        await self.session.commit()
        return queue

    async def list(self):
        return await self.repo.list_active()

    async def list_by_project(self, project_id: uuid.UUID):
        return await self.repo.list_by_project(project_id)

    async def get(self, queue_id: uuid.UUID):
        return await self.repo.get_active(queue_id)

    async def update(self, queue_id: uuid.UUID, data: QueueUpdate):
        queue = await self.repo.update(
            queue_id,
            **data.model_dump(exclude_unset=True),
        )

        await self.session.commit()
        return queue

    async def delete(self, queue_id: uuid.UUID):
        await self.repo.soft_delete(queue_id)
        await self.session.commit()
