"""
Job execution service.

Orchestrates business logic for job execution CRUD, delegating all
persistence to JobExecutionRepository. Follows the same pattern as
OrganizationService, ProjectService, QueueService, JobService, WorkerService,
WorkerHeartbeatService, RetryPolicyService, and ScheduledJobService.
"""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.job_execution_repository import JobExecutionRepository
from app.repositories.job_repository import JobRepository
from app.repositories.worker_repository import WorkerRepository
from app.schemas.job_execution import JobExecutionCreate, JobExecutionUpdate


class JobExecutionService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = JobExecutionRepository(session)

    async def create(self, data: JobExecutionCreate):
        job = await JobRepository(self.session).get_active(data.job_id)
        if not job:
            raise ValueError("Job not found or inactive.")

        if data.worker_id:
            worker = await WorkerRepository(self.session).get_active(
                data.worker_id
            )
            if not worker:
                raise ValueError("Worker not found or inactive.")

        existing = await self.repo.get_by_job_and_attempt(
            data.job_id,
            data.attempt_number,
        )
        if existing:
            raise ValueError(
                f"Job execution attempt {data.attempt_number} already exists for this job."
            )

        execution = await self.repo.create(
            job_id=data.job_id,
            worker_id=data.worker_id,
            status=data.status,
            attempt_number=data.attempt_number,
            started_at=data.started_at,
            finished_at=data.finished_at,
            result=data.result,
            error_message=data.error_message,
        )

        await self.session.commit()
        return execution

    async def list(self):
        return await self.repo.list_all()

    async def list_by_job(self, job_id: uuid.UUID):
        return await self.repo.list_by_job(job_id)

    async def list_by_worker(self, worker_id: uuid.UUID):
        return await self.repo.list_by_worker(worker_id)

    async def get(self, execution_id: uuid.UUID):
        return await self.repo.get(execution_id)

    async def update(
        self,
        execution_id: uuid.UUID,
        data: JobExecutionUpdate,
    ):
        if data.worker_id:
            worker = await WorkerRepository(self.session).get_active(
                data.worker_id
            )
            if not worker:
                raise ValueError("Worker not found or inactive.")

        execution = await self.repo.update(
            execution_id,
            **data.model_dump(exclude_unset=True),
        )

        await self.session.commit()
        return execution

    async def delete(self, execution_id: uuid.UUID):
        await self.repo.delete(execution_id)
        await self.session.commit()
