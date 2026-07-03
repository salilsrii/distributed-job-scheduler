import uuid
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.base import SoftDeleteRepository


class UserRepository(SoftDeleteRepository[User]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(User, session)

    async def get_by_email(self, email: str) -> User | None:
        result = await self.session.execute(
            select(User).where(User.email == email, User.is_deleted.is_(False))
        )
        return result.scalar_one_or_none()

    async def list_by_organization(self, organization_id: uuid.UUID) -> Sequence[User]:
        result = await self.session.execute(
            select(User).where(User.organization_id == organization_id, User.is_deleted.is_(False))
        )
        return result.scalars().all()