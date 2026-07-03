"""
Retry policy repository.

Extends BaseRepository with retry-policy-specific queries
that mirror the patterns used across other repositories.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.retry_policy import RetryPolicy
from app.repositories.base import BaseRepository


class RetryPolicyRepository(BaseRepository[RetryPolicy]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(RetryPolicy, session)

    async def list_all(self) -> list[RetryPolicy]:
        result = await self.session.execute(
            select(RetryPolicy).order_by(RetryPolicy.created_at.desc())
        )
        return result.scalars().all()

    async def get_by_job_id(
        self,
        job_id: uuid.UUID,
    ) -> RetryPolicy | None:
        result = await self.session.execute(
            select(RetryPolicy).where(RetryPolicy.job_id == job_id)
        )
        return result.scalar_one_or_none()