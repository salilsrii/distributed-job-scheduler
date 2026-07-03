"""
Scheduled job service.

Orchestrates business logic for scheduled job CRUD, delegating all
persistence to ScheduledJobRepository. Follows the same pattern as
OrganizationService, ProjectService, QueueService, JobService, WorkerService,
WorkerHeartbeatService, and RetryPolicyService.
"""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.job_repository import JobRepository
from app.repositories.scheduled_job_repository import ScheduledJobRepository
from app.schemas.scheduled_job import ScheduledJobCreate, ScheduledJobUpdate


class ScheduledJobService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = ScheduledJobRepository(session)

    async def create(self, data: ScheduledJobCreate):
        job = await JobRepository(self.session).get_active(data.job_id)
        if not job:
            raise ValueError("Job not found or inactive.")

        existing = await self.repo.get_by_job_and_cron(
            data.job_id,
            data.cron_expression,
        )
        if existing:
            raise ValueError(
                "Scheduled job with this cron expression already exists for this job."
            )

        scheduled_job = await self.repo.create(
            job_id=data.job_id,
            cron_expression=data.cron_expression,
            next_run_at=data.next_run_at,
            is_active=data.is_active,
        )

        await self.session.commit()
        return scheduled_job

    async def list(self):
        return await self.repo.list_all()

    async def list_by_job(self, job_id: uuid.UUID):
        return await self.repo.list_by_job(job_id)

    async def get(self, scheduled_job_id: uuid.UUID):
        return await self.repo.get(scheduled_job_id)

    async def update(
        self,
        scheduled_job_id: uuid.UUID,
        data: ScheduledJobUpdate,
    ):
        scheduled_job = await self.repo.update(
            scheduled_job_id,
            **data.model_dump(exclude_unset=True),
        )

        await self.session.commit()
        return scheduled_job

    async def delete(self, scheduled_job_id: uuid.UUID):
        await self.repo.delete(scheduled_job_id)
        await self.session.commit()
