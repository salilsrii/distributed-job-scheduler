"""
Job service.

Orchestrates business logic for job CRUD, delegating all
persistence to JobRepository. Follows the same pattern as
OrganizationService, ProjectService, and QueueService.
"""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.job_repository import JobRepository
from app.schemas.job import JobCreate, JobUpdate


class JobService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = JobRepository(session)

    async def create(self, data: JobCreate):
        existing = await self.repo.get_by_name(
            data.queue_id,
            data.name,
        )

        if existing:
            raise ValueError("Job with this name already exists in the queue.")

        job = await self.repo.create(
            queue_id=data.queue_id,
            created_by=data.created_by,
            name=data.name,
            description=data.description,
            payload=data.payload,
            priority=data.priority,
            max_retries=data.max_retries,
            timeout_seconds=data.timeout_seconds,
        )

        await self.session.commit()
        return job

    async def list(self):
        return await self.repo.list_active()

    async def list_by_queue(self, queue_id: uuid.UUID):
        return await self.repo.list_by_queue(queue_id)

    async def get(self, job_id: uuid.UUID):
        return await self.repo.get_active(job_id)

    async def update(
        self,
        job_id: uuid.UUID,
        data: JobUpdate,
    ):
        job = await self.repo.update(
            job_id,
            **data.model_dump(exclude_unset=True),
        )

        await self.session.commit()
        return job

    async def delete(self, job_id: uuid.UUID):
        await self.repo.soft_delete(job_id)
        await self.session.commit()