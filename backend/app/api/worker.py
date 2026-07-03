"""
Worker API router.

Exposes full CRUD for the Worker resource under /api/v1/workers.
Follows the same structure as api/organization.py, api/project.py, api/queue.py, and api/job.py:
  - POST   /workers/                create (with duplicate hostname validation per organization)
  - GET    /workers/                list all active
  - GET    /workers/{worker_id}     get single
  - PUT    /workers/{worker_id}     update
  - DELETE /workers/{worker_id}     soft-delete
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.worker import (
    WorkerCreate,
    WorkerResponse,
    WorkerUpdate,
)
from app.services.worker_service import WorkerService

router = APIRouter(
    prefix="/workers",
    tags=["Workers"],
)


@router.post(
    "/",
    response_model=WorkerResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_worker(
    worker: WorkerCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await WorkerService(db).create(worker)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "/",
    response_model=list[WorkerResponse],
)
async def list_workers(
    db: AsyncSession = Depends(get_db),
):
    return await WorkerService(db).list()


@router.get("/stats")
async def get_worker_stats(
    db: AsyncSession = Depends(get_db),
):
    workers = await WorkerService(db).list()
    total = len(workers)
    online = sum(1 for w in workers if getattr(w, "status", None) == "online")
    busy = sum(1 for w in workers if getattr(w, "status", None) == "busy")
    offline = sum(1 for w in workers if getattr(w, "status", None) == "offline")
    draining = sum(1 for w in workers if getattr(w, "status", None) == "draining")
    return {
        "total": total,
        "online": online,
        "busy": busy,
        "offline": offline,
        "draining": draining,
    }


@router.get(
    "/{worker_id}",
    response_model=WorkerResponse,
)
async def get_worker(
    worker_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    worker = await WorkerService(db).get(worker_id)

    if worker is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker not found",
        )

    return worker


@router.put(
    "/{worker_id}",
    response_model=WorkerResponse,
)
@router.patch(
    "/{worker_id}",
    response_model=WorkerResponse,
)
async def update_worker(
    worker_id: UUID,
    worker: WorkerUpdate,
    db: AsyncSession = Depends(get_db),
):
    updated = await WorkerService(db).update(
        worker_id,
        worker,
    )

    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker not found",
        )

    return updated


@router.delete(
    "/{worker_id}",
    status_code=status.HTTP_200_OK,
)
async def delete_worker(
    worker_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    worker = await WorkerService(db).get(worker_id)

    if worker is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker not found",
        )

    await WorkerService(db).delete(worker_id)

    return {
        "success": True,
        "message": "Worker deleted successfully",
    }


@router.post("/{worker_id}/drain")
async def drain_worker(
    worker_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    worker = await WorkerService(db).get(worker_id)
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")
    return {"success": True, "message": "Worker draining"}


@router.get("/{worker_id}/heartbeats")
async def get_worker_heartbeats(
    worker_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    from app.services.worker_heartbeat_service import WorkerHeartbeatService
    hbs = await WorkerHeartbeatService(db).list()
    filtered = [h for h in hbs if getattr(h, "worker_id", None) == worker_id]
    return {"items": filtered, "total": len(filtered)}

