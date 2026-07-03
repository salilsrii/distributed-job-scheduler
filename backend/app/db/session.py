"""
Database session and engine configuration.

Provides the async SQLAlchemy engine, session factory, and a
FastAPI-compatible dependency (`get_db`) for injecting a database
session into request handlers/services via Dependency Injection.
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings
from app.core.logging import get_logger

settings = get_settings()
logger = get_logger(__name__)


def create_engine() -> AsyncEngine:
    """
    Create and configure the async SQLAlchemy engine.
    """
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.APP_DEBUG,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        future=True,
    )
    return engine


engine: AsyncEngine = create_engine()

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields a database session.

    Ensures the session is properly closed after the request,
    and rolled back on error.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            logger.exception("Database session rollback due to exception")
            raise
        finally:
            await session.close()


async def check_db_connection() -> bool:
    """
    Verify database connectivity. Used by the /health endpoint.
    """
    from sqlalchemy import text

    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        return True
    except Exception:
        logger.exception("Database health check failed")
        return False