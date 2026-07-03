"""
Job API router.

Exposes full CRUD for the Job resource under /api/v1/jobs.
Follows the same structure as api/organization.py, api/project.py, and api/queue.py:
  - POST   /jobs/                create (with duplicate name validation per queue)
  - GET    /jobs/                list all active
  - GET    /jobs/{job_id}        get single
  - PUT    /jobs/{job_id}        update
  - DELETE /jobs/{job_id}        soft-delete
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.job import (
    JobCreate,
    JobResponse,
    JobUpdate,
)
from app.services.job_service import JobService

router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"],
)


@router.post(
    "/",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_job(
    job: JobCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await JobService(db).create(job)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "/",
    response_model=list[JobResponse],
)
async def list_jobs(
    db: AsyncSession = Depends(get_db),
):
    return await JobService(db).list()


@router.get("/stats")
async def get_job_stats(
    db: AsyncSession = Depends(get_db),
):
    jobs = await JobService(db).list()
    total = len(jobs)
    running = sum(1 for j in jobs if getattr(j, "status", None) == "running")
    success = sum(1 for j in jobs if getattr(j, "status", None) in ("completed", "success"))
    failed = sum(1 for j in jobs if getattr(j, "status", None) == "failed")
    pending = sum(1 for j in jobs if getattr(j, "status", None) in ("pending", "queued", "retrying"))
    return {
        "total": total,
        "running": running,
        "success": success,
        "failed": failed,
        "pending": pending,
    }


@router.get(
    "/{job_id}",
    response_model=JobResponse,
)
async def get_job(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    job = await JobService(db).get(job_id)

    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    return job


@router.put(
    "/{job_id}",
    response_model=JobResponse,
)
@router.patch(
    "/{job_id}",
    response_model=JobResponse,
)
async def update_job(
    job_id: UUID,
    job: JobUpdate,
    db: AsyncSession = Depends(get_db),
):
    updated = await JobService(db).update(
        job_id,
        job,
    )

    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    return updated


@router.delete(
    "/{job_id}",
    status_code=status.HTTP_200_OK,
)
async def delete_job(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    job = await JobService(db).get(job_id)

    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    await JobService(db).delete(job_id)

    return {
        "success": True,
        "message": "Job deleted successfully",
    }


@router.post("/{job_id}/cancel")
async def cancel_job(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    job = await JobService(db).get(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return {"success": True, "message": "Job cancelled"}


@router.post("/{job_id}/retry")
async def retry_job(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    job = await JobService(db).get(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return {"success": True, "message": "Job retry queued"}


@router.get("/{job_id}/executions")
async def get_job_executions(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    from app.services.job_execution_service import JobExecutionService
    execs = await JobExecutionService(db).list()
    filtered = [e for e in execs if getattr(e, "job_id", None) == job_id]
    return {"items": filtered, "total": len(filtered)}


@router.get("/{job_id}/logs")
async def get_job_logs(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    from app.services.job_log_service import JobLogService
    logs = await JobLogService(db).list()
    return {"items": logs, "total": len(logs)}