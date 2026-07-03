import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.repositories.base import SoftDeleteRepository


class ProjectRepository(SoftDeleteRepository[Project]):
    def __init__(self, session: AsyncSession):
        super().__init__(Project, session)

    async def list_by_organization(
        self,
        organization_id: uuid.UUID,
    ) -> list[Project]:
        result = await self.session.execute(
            select(Project).where(
                Project.organization_id == organization_id,
                Project.is_deleted.is_(False),
            )
        )
        return result.scalars().all()

    async def get_by_name(
        self,
        organization_id: uuid.UUID,
        name: str,
    ) -> Project | None:
        result = await self.session.execute(
            select(Project).where(
                Project.organization_id == organization_id,
                Project.name == name,
                Project.is_deleted.is_(False),
            )
        )
        return result.scalar_one_or_none()