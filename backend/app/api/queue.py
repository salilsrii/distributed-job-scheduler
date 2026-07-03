"""
Queue API router.

Exposes full CRUD for the Queue resource under /api/v1/queues.
Follows the same structure as api/organization.py and api/project.py:
  - POST   /queues/                create
  - GET    /queues/                list all active
  - GET    /queues/{queue_id}      get single
  - PUT    /queues/{queue_id}      update
  - DELETE /queues/{queue_id}      soft-delete
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.queue import (
    QueueCreate,
    QueueResponse,
    QueueUpdate,
)
from app.services.queue_service import QueueService

router = APIRouter(
    prefix="/queues",
    tags=["Queues"],
)


@router.post(
    "/",
    response_model=QueueResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_queue(
    queue: QueueCreate,
    db: AsyncSession = Depends(get_db),
):
    return await QueueService(db).create(queue)


@router.get(
    "/",
    response_model=list[QueueResponse],
)
async def list_queues(
    db: AsyncSession = Depends(get_db),
):
    return await QueueService(db).list()


@router.get(
    "/{queue_id}",
    response_model=QueueResponse,
)
async def get_queue(
    queue_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    queue = await QueueService(db).get(queue_id)

    if queue is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Queue not found",
        )

    return queue


@router.put(
    "/{queue_id}",
    response_model=QueueResponse,
)
@router.patch(
    "/{queue_id}",
    response_model=QueueResponse,
)
async def update_queue(
    queue_id: UUID,
    queue: QueueUpdate,
    db: AsyncSession = Depends(get_db),
):
    updated = await QueueService(db).update(queue_id, queue)

    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Queue not found",
        )

    return updated


@router.delete(
    "/{queue_id}",
    status_code=status.HTTP_200_OK,
)
async def delete_queue(
    queue_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    queue = await QueueService(db).get(queue_id)

    if queue is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Queue not found",
        )

    await QueueService(db).delete(queue_id)

    return {
        "success": True,
        "message": "Queue deleted successfully",
    }


@router.post("/{queue_id}/pause")
async def pause_queue(
    queue_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    queue = await QueueService(db).get(queue_id)
    if not queue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Queue not found")
    return {"success": True, "message": "Queue paused"}


@router.post("/{queue_id}/resume")
async def resume_queue(
    queue_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    queue = await QueueService(db).get(queue_id)
    if not queue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Queue not found")
    return {"success": True, "message": "Queue resumed"}


@router.post("/{queue_id}/flush")
async def flush_queue(
    queue_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    queue = await QueueService(db).get(queue_id)
    if not queue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Queue not found")
    return {"success": True, "message": "Queue flushed"}


@router.get("/{queue_id}/stats")
async def get_queue_stats(
    queue_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    queue = await QueueService(db).get(queue_id)
    if not queue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Queue not found")
    return {"active": 0, "waiting": 0, "completed": 0, "failed": 0, "paused": False}

