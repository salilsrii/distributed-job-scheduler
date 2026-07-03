"""
Dead letter queue API router.

Exposes full CRUD for the DeadLetterQueue resource under /api/v1/dead-letter-queue.
Follows the same structure as api/organization.py, api/project.py, api/queue.py,
api/job.py, api/worker.py, api/worker_heartbeat.py, api/retry_policy.py,
api/scheduled_job.py, api/job_execution.py, and api/job_log.py:
  - POST   /dead-letter-queue/                         create (with job validation)
  - GET    /dead-letter-queue/                         list all
  - GET    /dead-letter-queue/{dlq_id}                 get single by ID
  - GET    /dead-letter-queue/job/{job_id}             list by job ID
  - GET    /dead-letter-queue/execution/{execution_id} get by job execution ID
  - PUT    /dead-letter-queue/{dlq_id}                 update
  - DELETE /dead-letter-queue/{dlq_id}                 delete
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.dead_letter_queue import (
    DeadLetterQueueCreate,
    DeadLetterQueueResponse,
    DeadLetterQueueUpdate,
)
from app.services.dead_letter_queue_service import DeadLetterQueueService

router = APIRouter(
    prefix="/dead-letter-queue",
    tags=["Dead Letter Queue"],
)


@router.post(
    "/",
    response_model=DeadLetterQueueResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_dead_letter_queue(
    entry: DeadLetterQueueCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await DeadLetterQueueService(db).create(entry)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "/",
    response_model=list[DeadLetterQueueResponse],
)
async def list_dead_letter_queue(
    db: AsyncSession = Depends(get_db),
):
    return await DeadLetterQueueService(db).list()


@router.get(
    "/job/{job_id}",
    response_model=list[DeadLetterQueueResponse],
)
async def list_dead_letter_queue_by_job(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    return await DeadLetterQueueService(db).list_by_job(job_id)


@router.get(
    "/execution/{job_execution_id}",
    response_model=DeadLetterQueueResponse,
)
async def get_dead_letter_queue_by_execution(
    job_execution_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    entry = await DeadLetterQueueService(db).get_by_execution(job_execution_id)

    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dead letter queue entry not found",
        )

    return entry


@router.get(
    "/{dlq_id}",
    response_model=DeadLetterQueueResponse,
)
async def get_dead_letter_queue(
    dlq_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    entry = await DeadLetterQueueService(db).get(dlq_id)

    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dead letter queue entry not found",
        )

    return entry


@router.put(
    "/{dlq_id}",
    response_model=DeadLetterQueueResponse,
)
async def update_dead_letter_queue(
    dlq_id: UUID,
    entry: DeadLetterQueueUpdate,
    db: AsyncSession = Depends(get_db),
):
    updated = await DeadLetterQueueService(db).update(
        dlq_id,
        entry,
    )

    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dead letter queue entry not found",
        )

    return updated


@router.delete(
    "/{dlq_id}",
    status_code=status.HTTP_200_OK,
)
async def delete_dead_letter_queue(
    dlq_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    entry = await DeadLetterQueueService(db).get(dlq_id)

    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dead letter queue entry not found",
        )

    await DeadLetterQueueService(db).delete(dlq_id)

    return {
        "success": True,
        "message": "Dead letter queue entry deleted successfully",
    }
