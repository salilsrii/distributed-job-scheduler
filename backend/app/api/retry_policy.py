"""
Retry policy API router.

Exposes full CRUD for the RetryPolicy resource under /api/v1/retry-policies.
Follows the same structure as api/organization.py, api/project.py, api/queue.py, api/job.py, api/worker.py, and api/worker_heartbeat.py:
  - POST   /retry-policies/                create (with job and duplicate validation)
  - GET    /retry-policies/                list all
  - GET    /retry-policies/{policy_id}     get single by policy ID
  - GET    /retry-policies/job/{job_id}    get single by job ID
  - PUT    /retry-policies/{policy_id}     update
  - DELETE /retry-policies/{policy_id}     delete
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.retry_policy import (
    RetryPolicyCreate,
    RetryPolicyResponse,
    RetryPolicyUpdate,
)
from app.services.retry_policy_service import RetryPolicyService

router = APIRouter(
    prefix="/retry-policies",
    tags=["Retry Policies"],
)


@router.post(
    "/",
    response_model=RetryPolicyResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_retry_policy(
    policy: RetryPolicyCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await RetryPolicyService(db).create(policy)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "/",
    response_model=list[RetryPolicyResponse],
)
async def list_retry_policies(
    db: AsyncSession = Depends(get_db),
):
    return await RetryPolicyService(db).list()


@router.get(
    "/job/{job_id}",
    response_model=RetryPolicyResponse,
)
async def get_retry_policy_by_job(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    policy = await RetryPolicyService(db).get_by_job_id(job_id)

    if policy is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Retry policy not found for this job",
        )

    return policy


@router.get(
    "/{policy_id}",
    response_model=RetryPolicyResponse,
)
async def get_retry_policy(
    policy_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    policy = await RetryPolicyService(db).get(policy_id)

    if policy is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Retry policy not found",
        )

    return policy


@router.put(
    "/{policy_id}",
    response_model=RetryPolicyResponse,
)
async def update_retry_policy(
    policy_id: UUID,
    policy: RetryPolicyUpdate,
    db: AsyncSession = Depends(get_db),
):
    updated = await RetryPolicyService(db).update(
        policy_id,
        policy,
    )

    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Retry policy not found",
        )

    return updated


@router.delete(
    "/{policy_id}",
    status_code=status.HTTP_200_OK,
)
async def delete_retry_policy(
    policy_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    policy = await RetryPolicyService(db).get(policy_id)

    if policy is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Retry policy not found",
        )

    await RetryPolicyService(db).delete(policy_id)

    return {
        "success": True,
        "message": "Retry policy deleted successfully",
    }
