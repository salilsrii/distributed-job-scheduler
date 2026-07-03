from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.project import (
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)
from app.services.project_service import ProjectService

router = APIRouter(
    prefix="/projects",
    tags=["Projects"],
)


@router.post(
    "/",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_project(
    project: ProjectCreate,
    db: AsyncSession = Depends(get_db),
):
    return await ProjectService(db).create(project)


@router.get(
    "/",
    response_model=list[ProjectResponse],
)
async def list_projects(
    db: AsyncSession = Depends(get_db),
):
    return await ProjectService(db).list()


@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
)
async def get_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    project = await ProjectService(db).get(project_id)

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return project


@router.put(
    "/{project_id}",
    response_model=ProjectResponse,
)
@router.patch(
    "/{project_id}",
    response_model=ProjectResponse,
)
async def update_project(
    project_id: UUID,
    project: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
):
    updated = await ProjectService(db).update(project_id, project)

    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return updated


@router.delete("/{project_id}")
async def delete_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    await ProjectService(db).delete(project_id)

    return {
        "success": True,
        "message": "Project deleted successfully",
    }