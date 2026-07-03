from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization import Organization
from app.repositories.organization_repository import OrganizationRepository
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationUpdate,
)


class OrganizationService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = OrganizationRepository(session)

    async def create(self, data: OrganizationCreate):
        org = await self.repo.create(
            name=data.name,
            slug=data.slug,
        )

        await self.session.commit()

        return org

    async def list(self):
        return await self.repo.list_active()

    async def get(self, organization_id):
        return await self.repo.get_active(organization_id)

    async def update(self, organization_id, data: OrganizationUpdate):
        org = await self.repo.update(
            organization_id,
            **data.model_dump(exclude_unset=True),
        )

        await self.session.commit()

        return org

    async def delete(self, organization_id):
        await self.repo.soft_delete(organization_id)
        await self.session.commit()