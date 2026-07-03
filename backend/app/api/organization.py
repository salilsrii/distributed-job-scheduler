from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationResponse,
    OrganizationUpdate,
)
from app.services.organization_service import OrganizationService

router = APIRouter(
    prefix="/organizations",
    tags=["Organizations"],
)


@router.post(
    "/",
    response_model=OrganizationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_organization(
    organization: OrganizationCreate,
    db: AsyncSession = Depends(get_db),
):
    return await OrganizationService(db).create(organization)


@router.get(
    "/",
    response_model=list[OrganizationResponse],
)
async def list_organizations(
    db: AsyncSession = Depends(get_db),
):
    return await OrganizationService(db).list()


@router.get(
    "/{organization_id}",
    response_model=OrganizationResponse,
)
async def get_organization(
    organization_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    organization = await OrganizationService(db).get(organization_id)

    if organization is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    return organization


@router.put(
    "/{organization_id}",
    response_model=OrganizationResponse,
)
async def update_organization(
    organization_id: UUID,
    organization: OrganizationUpdate,
    db: AsyncSession = Depends(get_db),
):
    updated = await OrganizationService(db).update(
        organization_id,
        organization,
    )

    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    return updated


@router.delete(
    "/{organization_id}",
    status_code=status.HTTP_200_OK,
)
async def delete_organization(
    organization_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    organization = await OrganizationService(db).get(organization_id)

    if organization is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    await OrganizationService(db).delete(organization_id)

    return {
        "success": True,
        "message": "Organization deleted successfully",
    }