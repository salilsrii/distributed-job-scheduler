"""
Worker heartbeat service.

Orchestrates business logic for worker heartbeat CRUD, delegating all
persistence to WorkerHeartbeatRepository. Follows the same pattern as
OrganizationService, ProjectService, QueueService, JobService, and WorkerService.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.worker_heartbeat_repository import WorkerHeartbeatRepository
from app.repositories.worker_repository import WorkerRepository
from app.schemas.worker_heartbeat import WorkerHeartbeatCreate, WorkerHeartbeatUpdate


class WorkerHeartbeatService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = WorkerHeartbeatRepository(session)

    async def create(self, data: WorkerHeartbeatCreate):
        worker = await WorkerRepository(self.session).get_active(data.worker_id)
        if not worker:
            raise ValueError("Worker not found or inactive.")

        heartbeat = await self.repo.create(
            worker_id=data.worker_id,
            status=data.status,
            cpu_usage=data.cpu_usage,
            memory_usage=data.memory_usage,
        )

        worker.last_seen_at = datetime.now(timezone.utc)
        worker.status = data.status

        await self.session.commit()
        return heartbeat

    async def list(self):
        return await self.repo.list_all()

    async def list_by_worker(self, worker_id: uuid.UUID):
        return await self.repo.list_by_worker(worker_id)

    async def get(self, heartbeat_id: uuid.UUID):
        return await self.repo.get(heartbeat_id)

    async def update(
        self,
        heartbeat_id: uuid.UUID,
        data: WorkerHeartbeatUpdate,
    ):
        heartbeat = await self.repo.update(
            heartbeat_id,
            **data.model_dump(exclude_unset=True),
        )

        await self.session.commit()
        return heartbeat

    async def delete(self, heartbeat_id: uuid.UUID):
        await self.repo.delete(heartbeat_id)
        await self.session.commit()
