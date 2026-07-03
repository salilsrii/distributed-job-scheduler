"""
Dead letter queue service.

Orchestrates business logic for dead letter queue CRUD, delegating all
persistence to DeadLetterQueueRepository. Follows the same pattern as
OrganizationService, ProjectService, QueueService, JobService, WorkerService,
WorkerHeartbeatService, RetryPolicyService, ScheduledJobService,
JobExecutionService, and JobLogService.
"""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.dead_letter_queue_repository import (
    DeadLetterQueueRepository,
)
from app.repositories.job_execution_repository import JobExecutionRepository
from app.repositories.job_repository import JobRepository
from app.schemas.dead_letter_queue import (
    DeadLetterQueueCreate,
    DeadLetterQueueUpdate,
)


class DeadLetterQueueService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = DeadLetterQueueRepository(session)

    async def create(self, data: DeadLetterQueueCreate):
        job = await JobRepository(self.session).get_active(data.job_id)
        if not job:
            raise ValueError("Job not found or inactive.")

        if data.job_execution_id:
            execution = await JobExecutionRepository(self.session).get(
                data.job_execution_id
            )
            if not execution:
                raise ValueError("Job execution not found.")

            existing_dlq = await self.repo.get_by_execution(
                data.job_execution_id
            )
            if existing_dlq:
                raise ValueError(
                    "Dead letter queue entry already exists for this job execution."
                )

        entry = await self.repo.create(
            job_id=data.job_id,
            job_execution_id=data.job_execution_id,
            reason=data.reason,
            payload_snapshot=data.payload_snapshot,
            failed_at=data.failed_at,
        )

        await self.session.commit()
        return entry

    async def list(self):
        return await self.repo.list_all()

    async def list_by_job(self, job_id: uuid.UUID):
        return await self.repo.list_by_job(job_id)

    async def get_by_execution(self, job_execution_id: uuid.UUID):
        return await self.repo.get_by_execution(job_execution_id)

    async def get(self, dlq_id: uuid.UUID):
        return await self.repo.get(dlq_id)

    async def update(
        self,
        dlq_id: uuid.UUID,
        data: DeadLetterQueueUpdate,
    ):
        entry = await self.repo.update(
            dlq_id,
            **data.model_dump(exclude_unset=True),
        )

        await self.session.commit()
        return entry

    async def delete(self, dlq_id: uuid.UUID):
        await self.repo.delete(dlq_id)
        await self.session.commit()
