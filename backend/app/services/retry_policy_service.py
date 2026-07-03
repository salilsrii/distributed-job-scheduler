"""
Retry policy service.

Orchestrates business logic for retry policy CRUD, delegating all
persistence to RetryPolicyRepository. Follows the same pattern as
OrganizationService, ProjectService, QueueService, JobService, WorkerService, and WorkerHeartbeatService.
"""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.job_repository import JobRepository
from app.repositories.retry_policy_repository import RetryPolicyRepository
from app.schemas.retry_policy import RetryPolicyCreate, RetryPolicyUpdate


class RetryPolicyService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = RetryPolicyRepository(session)

    async def create(self, data: RetryPolicyCreate):
        job = await JobRepository(self.session).get_active(data.job_id)
        if not job:
            raise ValueError("Job not found or inactive.")

        existing = await self.repo.get_by_job_id(data.job_id)
        if existing:
            raise ValueError("Retry policy already exists for this job.")

        policy = await self.repo.create(
            job_id=data.job_id,
            max_retries=data.max_retries,
            backoff_strategy=data.backoff_strategy,
            backoff_seconds=data.backoff_seconds,
            max_backoff_seconds=data.max_backoff_seconds,
        )

        await self.session.commit()
        return policy

    async def list(self):
        return await self.repo.list_all()

    async def get_by_job_id(self, job_id: uuid.UUID):
        return await self.repo.get_by_job_id(job_id)

    async def get(self, policy_id: uuid.UUID):
        return await self.repo.get(policy_id)

    async def update(
        self,
        policy_id: uuid.UUID,
        data: RetryPolicyUpdate,
    ):
        policy = await self.repo.update(
            policy_id,
            **data.model_dump(exclude_unset=True),
        )

        await self.session.commit()
        return policy

    async def delete(self, policy_id: uuid.UUID):
        await self.repo.delete(policy_id)
        await self.session.commit()
