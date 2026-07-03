from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization import Organization
from app.repositories.base import SoftDeleteRepository


class OrganizationRepository(SoftDeleteRepository[Organization]):
    def __init__(self, session: AsyncSession):
        super().__init__(Organization, session)

    async def get_by_slug(self, slug: str) -> Organization | None:
        result = await self.session.execute(
            select(Organization).where(
                Organization.slug == slug,
                Organization.is_deleted.is_(False),
            )
        )
        return result.scalar_one_or_none()

    async def get_by_name(self, name: str) -> Organization | None:
        result = await self.session.execute(
            select(Organization).where(
                Organization.name == name,
                Organization.is_deleted.is_(False),
            )
        )
        return result.scalar_one_or_none()
