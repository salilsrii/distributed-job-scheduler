"""
Scheduled job API router.

Exposes full CRUD for the ScheduledJob resource under /api/v1/scheduled-jobs.
Follows the same structure as api/organization.py, api/project.py, api/queue.py,
api/job.py, api/worker.py, api/worker_heartbeat.py, and api/retry_policy.py:
  - POST   /scheduled-jobs/                     create (with job and duplicate validation)
  - GET    /scheduled-jobs/                     list all
  - GET    /scheduled-jobs/{scheduled_job_id}   get single by ID
  - GET    /scheduled-jobs/job/{job_id}         list by job ID
  - PUT    /scheduled-jobs/{scheduled_job_id}   update
  - DELETE /scheduled-jobs/{scheduled_job_id}   delete
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.scheduled_job import (
    ScheduledJobCreate,
    ScheduledJobResponse,
    ScheduledJobUpdate,
)
from app.services.scheduled_job_service import ScheduledJobService

router = APIRouter(
    prefix="/scheduled-jobs",
    tags=["Scheduled Jobs"],
)


@router.post(
    "/",
    response_model=ScheduledJobResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_scheduled_job(
    scheduled_job: ScheduledJobCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await ScheduledJobService(db).create(scheduled_job)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "/",
    response_model=list[ScheduledJobResponse],
)
async def list_scheduled_jobs(
    db: AsyncSession = Depends(get_db),
):
    return await ScheduledJobService(db).list()


@router.get(
    "/job/{job_id}",
    response_model=list[ScheduledJobResponse],
)
async def list_scheduled_jobs_by_job(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    return await ScheduledJobService(db).list_by_job(job_id)


@router.get(
    "/{scheduled_job_id}",
    response_model=ScheduledJobResponse,
)
async def get_scheduled_job(
    scheduled_job_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    scheduled_job = await ScheduledJobService(db).get(scheduled_job_id)

    if scheduled_job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheduled job not found",
        )

    return scheduled_job


@router.put(
    "/{scheduled_job_id}",
    response_model=ScheduledJobResponse,
)
async def update_scheduled_job(
    scheduled_job_id: UUID,
    scheduled_job: ScheduledJobUpdate,
    db: AsyncSession = Depends(get_db),
):
    updated = await ScheduledJobService(db).update(
        scheduled_job_id,
        scheduled_job,
    )

    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheduled job not found",
        )

    return updated


@router.delete(
    "/{scheduled_job_id}",
    status_code=status.HTTP_200_OK,
)
async def delete_scheduled_job(
    scheduled_job_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    scheduled_job = await ScheduledJobService(db).get(scheduled_job_id)

    if scheduled_job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheduled job not found",
        )

    await ScheduledJobService(db).delete(scheduled_job_id)

    return {
        "success": True,
        "message": "Scheduled job deleted successfully",
    }
