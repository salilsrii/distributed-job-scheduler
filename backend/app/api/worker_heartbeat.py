"""
Worker heartbeat API router.

Exposes full CRUD for the WorkerHeartbeat resource under /api/v1/worker-heartbeats.
Follows the same structure as api/organization.py, api/project.py, api/queue.py, api/job.py, and api/worker.py:
  - POST   /worker-heartbeats/                create (with worker validation)
  - GET    /worker-heartbeats/                list all
  - GET    /worker-heartbeats/{heartbeat_id}  get single
  - PUT    /worker-heartbeats/{heartbeat_id}  update
  - DELETE /worker-heartbeats/{heartbeat_id}  delete
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.worker_heartbeat import (
    WorkerHeartbeatCreate,
    WorkerHeartbeatResponse,
    WorkerHeartbeatUpdate,
)
from app.services.worker_heartbeat_service import WorkerHeartbeatService

router = APIRouter(
    prefix="/worker-heartbeats",
    tags=["Worker Heartbeats"],
)


@router.post(
    "/",
    response_model=WorkerHeartbeatResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_worker_heartbeat(
    heartbeat: WorkerHeartbeatCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await WorkerHeartbeatService(db).create(heartbeat)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "/",
    response_model=list[WorkerHeartbeatResponse],
)
async def list_worker_heartbeats(
    db: AsyncSession = Depends(get_db),
):
    return await WorkerHeartbeatService(db).list()


@router.get(
    "/{heartbeat_id}",
    response_model=WorkerHeartbeatResponse,
)
async def get_worker_heartbeat(
    heartbeat_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    heartbeat = await WorkerHeartbeatService(db).get(heartbeat_id)

    if heartbeat is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker heartbeat not found",
        )

    return heartbeat


@router.put(
    "/{heartbeat_id}",
    response_model=WorkerHeartbeatResponse,
)
async def update_worker_heartbeat(
    heartbeat_id: UUID,
    heartbeat: WorkerHeartbeatUpdate,
    db: AsyncSession = Depends(get_db),
):
    updated = await WorkerHeartbeatService(db).update(
        heartbeat_id,
        heartbeat,
    )

    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker heartbeat not found",
        )

    return updated


@router.delete(
    "/{heartbeat_id}",
    status_code=status.HTTP_200_OK,
)
async def delete_worker_heartbeat(
    heartbeat_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    heartbeat = await WorkerHeartbeatService(db).get(heartbeat_id)

    if heartbeat is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker heartbeat not found",
        )

    await WorkerHeartbeatService(db).delete(heartbeat_id)

    return {
        "success": True,
        "message": "Worker heartbeat deleted successfully",
    }
