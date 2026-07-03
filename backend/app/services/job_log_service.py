"""
Job log service.

Orchestrates business logic for job log CRUD, delegating all
persistence to JobLogRepository. Follows the same pattern as
OrganizationService, ProjectService, QueueService, JobService, WorkerService,
WorkerHeartbeatService, RetryPolicyService, ScheduledJobService, and JobExecutionService.
"""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.job_execution_repository import JobExecutionRepository
from app.repositories.job_log_repository import JobLogRepository
from app.schemas.job_log import JobLogCreate, JobLogUpdate


class JobLogService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = JobLogRepository(session)

    async def create(self, data: JobLogCreate):
        execution = await JobExecutionRepository(self.session).get(
            data.job_execution_id
        )
        if not execution:
            raise ValueError("Job execution not found.")

        log = await self.repo.create(
            job_execution_id=data.job_execution_id,
            log_level=data.log_level,
            message=data.message,
        )

        await self.session.commit()
        return log

    async def list(self):
        return await self.repo.list_all()

    async def list_by_execution(self, job_execution_id: uuid.UUID):
        return await self.repo.list_by_execution(job_execution_id)

    async def get(self, log_id: uuid.UUID):
        return await self.repo.get(log_id)

    async def update(
        self,
        log_id: uuid.UUID,
        data: JobLogUpdate,
    ):
        log = await self.repo.update(
            log_id,
            **data.model_dump(exclude_unset=True),
        )

        await self.session.commit()
        return log

    async def delete(self, log_id: uuid.UUID):
        await self.repo.delete(log_id)
        await self.session.commit()
