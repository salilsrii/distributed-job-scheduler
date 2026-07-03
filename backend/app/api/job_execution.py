"""
Job execution API router.

Exposes full CRUD for the JobExecution resource under /api/v1/job-executions.
Follows the same structure as api/organization.py, api/project.py, api/queue.py,
api/job.py, api/worker.py, api/worker_heartbeat.py, api/retry_policy.py, and api/scheduled_job.py:
  - POST   /job-executions/                     create (with job and worker validation)
  - GET    /job-executions/                     list all
  - GET    /job-executions/{execution_id}       get single by ID
  - GET    /job-executions/job/{job_id}         list by job ID
  - GET    /job-executions/worker/{worker_id}   list by worker ID
  - PUT    /job-executions/{execution_id}       update
  - DELETE /job-executions/{execution_id}       delete
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.job_execution import (
    JobExecutionCreate,
    JobExecutionResponse,
    JobExecutionUpdate,
)
from app.services.job_execution_service import JobExecutionService

router = APIRouter(
    prefix="/job-executions",
    tags=["Job Executions"],
)


@router.post(
    "/",
    response_model=JobExecutionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_job_execution(
    execution: JobExecutionCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await JobExecutionService(db).create(execution)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "/",
    response_model=list[JobExecutionResponse],
)
async def list_job_executions(
    db: AsyncSession = Depends(get_db),
):
    return await JobExecutionService(db).list()


@router.get(
    "/job/{job_id}",
    response_model=list[JobExecutionResponse],
)
async def list_job_executions_by_job(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    return await JobExecutionService(db).list_by_job(job_id)


@router.get(
    "/worker/{worker_id}",
    response_model=list[JobExecutionResponse],
)
async def list_job_executions_by_worker(
    worker_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    return await JobExecutionService(db).list_by_worker(worker_id)


@router.get(
    "/{execution_id}",
    response_model=JobExecutionResponse,
)
async def get_job_execution(
    execution_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    execution = await JobExecutionService(db).get(execution_id)

    if execution is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job execution not found",
        )

    return execution


@router.put(
    "/{execution_id}",
    response_model=JobExecutionResponse,
)
async def update_job_execution(
    execution_id: UUID,
    execution: JobExecutionUpdate,
    db: AsyncSession = Depends(get_db),
):
    try:
        updated = await JobExecutionService(db).update(
            execution_id,
            execution,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job execution not found",
        )

    return updated


@router.delete(
    "/{execution_id}",
    status_code=status.HTTP_200_OK,
)
async def delete_job_execution(
    execution_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    execution = await JobExecutionService(db).get(execution_id)

    if execution is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job execution not found",
        )

    await JobExecutionService(db).delete(execution_id)

    return {
        "success": True,
        "message": "Job execution deleted successfully",
    }
