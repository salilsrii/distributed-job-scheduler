import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.retry_policy import RetryPolicy
from app.repositories.base import BaseRepository


class RetryPolicyRepository(BaseRepository[RetryPolicy]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(RetryPolicy, session)

    async def get_by_job_id(self, job_id: uuid.UUID) -> RetryPolicy | None:
        result = await self.session.execute(select(RetryPolicy).where(RetryPolicy.job_id == job_id))
        return result.scalar_one_or_none()