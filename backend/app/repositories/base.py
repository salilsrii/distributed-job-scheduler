"""
Generic repository base classes.

BaseRepository provides common async CRUD operations for any
SQLAlchemy 2.0 model. SoftDeleteRepository extends it with
soft-delete-aware queries for models using SoftDeleteMixin.
"""

import uuid
from datetime import datetime, timezone
from typing import Any, Generic, Sequence, Type, TypeVar

from sqlalchemy import delete as sa_delete
from sqlalchemy import func, select
from sqlalchemy import update as sa_update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Generic async repository providing common CRUD operations."""

    def __init__(self, model: Type[ModelType], session: AsyncSession) -> None:
        self.model = model
        self.session = session

    async def get(self, id: uuid.UUID) -> ModelType | None:
        result = await self.session.execute(select(self.model).where(self.model.id == id))
        return result.scalar_one_or_none()

    async def get_multi(self, *, offset: int = 0, limit: int = 100) -> Sequence[ModelType]:
        result = await self.session.execute(select(self.model).offset(offset).limit(limit))
        return result.scalars().all()

    async def create(self, **kwargs: Any) -> ModelType:
        instance = self.model(**kwargs)
        self.session.add(instance)
        await self.session.flush()
        await self.session.refresh(instance)
        return instance

    async def update(self, id: uuid.UUID, **kwargs: Any) -> ModelType | None:
        await self.session.execute(sa_update(self.model).where(self.model.id == id).values(**kwargs))
        await self.session.flush()
        return await self.get(id)

    async def delete(self, id: uuid.UUID) -> bool:
        """Hard delete. Prefer soft_delete() on models that support it."""
        result = await self.session.execute(sa_delete(self.model).where(self.model.id == id))
        await self.session.flush()
        return result.rowcount > 0

    async def count(self) -> int:
        result = await self.session.execute(select(func.count()).select_from(self.model))
        return result.scalar_one()


class SoftDeleteRepository(BaseRepository[ModelType]):
    """Adds soft-delete-aware queries for models with SoftDeleteMixin."""

    async def get_active(self, id: uuid.UUID) -> ModelType | None:
        result = await self.session.execute(
            select(self.model).where(self.model.id == id, self.model.is_deleted.is_(False))
        )
        return result.scalar_one_or_none()

    async def list_active(self, *, offset: int = 0, limit: int = 100) -> Sequence[ModelType]:
        result = await self.session.execute(
            select(self.model).where(self.model.is_deleted.is_(False)).offset(offset).limit(limit)
        )
        return result.scalars().all()

    async def soft_delete(self, id: uuid.UUID) -> ModelType | None:
        return await self.update(id, is_deleted=True, deleted_at=datetime.now(timezone.utc))

    async def restore(self, id: uuid.UUID) -> ModelType | None:
        return await self.update(id, is_deleted=False, deleted_at=None)