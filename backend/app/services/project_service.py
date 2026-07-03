from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.project_repository import ProjectRepository
from app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = ProjectRepository(session)

    async def create(self, data: ProjectCreate):
        project = await self.repo.create(
            organization_id=data.organization_id,
            name=data.name,
            description=data.description,
        )

        await self.session.commit()
        return project

    async def list(self):
        return await self.repo.list_active()

    async def get(self, project_id):
        return await self.repo.get_active(project_id)

    async def update(self, project_id, data: ProjectUpdate):
        project = await self.repo.update(
            project_id,
            **data.model_dump(exclude_unset=True),
        )

        await self.session.commit()
        return project

    async def delete(self, project_id):
        await self.repo.soft_delete(project_id)
        await self.session.commit()