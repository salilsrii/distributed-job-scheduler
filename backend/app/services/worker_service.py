"""
Worker service.

Orchestrates business logic for worker CRUD, delegating all
persistence to WorkerRepository. Follows the same pattern as
OrganizationService, ProjectService, QueueService, and JobService.
"""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.worker_repository import WorkerRepository
from app.schemas.worker import WorkerCreate, WorkerUpdate


class WorkerService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = WorkerRepository(session)

    async def create(self, data: WorkerCreate):
        existing = await self.repo.get_by_hostname(
            data.organization_id,
            data.hostname,
        )

        if existing:
            raise ValueError("Worker with this hostname already exists in the organization.")

        worker = await self.repo.create(
            organization_id=data.organization_id,
            hostname=data.hostname,
            ip_address=data.ip_address,
            status=data.status,
            capabilities=data.capabilities,
        )

        await self.session.commit()
        return worker

    async def list(self):
        return await self.repo.list_active()

    async def list_by_organization(self, organization_id: uuid.UUID):
        return await self.repo.list_by_organization(organization_id)

    async def get(self, worker_id: uuid.UUID):
        return await self.repo.get_active(worker_id)

    async def update(
        self,
        worker_id: uuid.UUID,
        data: WorkerUpdate,
    ):
        worker = await self.repo.update(
            worker_id,
            **data.model_dump(exclude_unset=True),
        )

        await self.session.commit()
        return worker

    async def delete(self, worker_id: uuid.UUID):
        await self.repo.soft_delete(worker_id)
        await self.session.commit()
