"""
Job log API router.

Exposes full CRUD for the JobLog resource under /api/v1/job-logs.
Follows the same structure as api/organization.py, api/project.py, api/queue.py,
api/job.py, api/worker.py, api/worker_heartbeat.py, api/retry_policy.py,
api/scheduled_job.py, and api/job_execution.py:
  - POST   /job-logs/                         create (with job execution validation)
  - GET    /job-logs/                         list all
  - GET    /job-logs/{log_id}                 get single by ID
  - GET    /job-logs/execution/{execution_id} list by job execution ID
  - PUT    /job-logs/{log_id}                 update
  - DELETE /job-logs/{log_id}                 delete
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.job_log import (
    JobLogCreate,
    JobLogResponse,
    JobLogUpdate,
)
from app.services.job_log_service import JobLogService

router = APIRouter(
    prefix="/job-logs",
    tags=["Job Logs"],
)


@router.post(
    "/",
    response_model=JobLogResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_job_log(
    log: JobLogCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await JobLogService(db).create(log)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "/",
    response_model=list[JobLogResponse],
)
async def list_job_logs(
    db: AsyncSession = Depends(get_db),
):
    return await JobLogService(db).list()


@router.get(
    "/execution/{job_execution_id}",
    response_model=list[JobLogResponse],
)
async def list_job_logs_by_execution(
    job_execution_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    return await JobLogService(db).list_by_execution(job_execution_id)


@router.get(
    "/{log_id}",
    response_model=JobLogResponse,
)
async def get_job_log(
    log_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    log = await JobLogService(db).get(log_id)

    if log is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job log not found",
        )

    return log


@router.put(
    "/{log_id}",
    response_model=JobLogResponse,
)
async def update_job_log(
    log_id: UUID,
    log: JobLogUpdate,
    db: AsyncSession = Depends(get_db),
):
    updated = await JobLogService(db).update(
        log_id,
        log,
    )

    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job log not found",
        )

    return updated


@router.delete(
    "/{log_id}",
    status_code=status.HTTP_200_OK,
)
async def delete_job_log(
    log_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    log = await JobLogService(db).get(log_id)

    if log is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job log not found",
        )

    await JobLogService(db).delete(log_id)

    return {
        "success": True,
        "message": "Job log deleted successfully",
    }
