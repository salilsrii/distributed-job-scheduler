"""
Application entrypoint.

Initializes the FastAPI application, configures middleware, logging,
and exposes the health check endpoint.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.job import router as job_router
from app.api.organization import router as organization_router
from app.api.project import router as project_router
from app.api.queue import router as queue_router
from app.core.config import get_settings
from app.core.logging import configure_logging, get_logger
from app.db.session import check_db_connection, engine

settings = get_settings()

configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    """

    logger.info(
        "Starting %s in '%s' mode",
        settings.APP_NAME,
        settings.APP_ENV,
    )

    db_ok = await check_db_connection()

    if db_ok:
        logger.info("Database connection established successfully.")
    else:
        logger.warning(
            "Database connection could NOT be established at startup."
        )

    yield

    logger.info("Shutting down %s", settings.APP_NAME)

    await engine.dispose()

    logger.info("Database engine disposed. Shutdown complete.")


def create_application() -> FastAPI:
    """
    Application factory.
    """

    app = FastAPI(
        title=settings.APP_NAME,
        version="0.1.0",
        description="Distributed Job Scheduler — Backend Service",
        debug=settings.APP_DEBUG,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # --------------------------------------------------------------
    # Middleware
    # --------------------------------------------------------------
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # --------------------------------------------------------------
    # API Routers
    # --------------------------------------------------------------
    app.include_router(
        organization_router,
        prefix=settings.API_V1_PREFIX,
    )

    app.include_router(
        project_router,
        prefix=settings.API_V1_PREFIX,
    )

    app.include_router(
        queue_router,
        prefix=settings.API_V1_PREFIX,
    )

    app.include_router(
        job_router,
        prefix=settings.API_V1_PREFIX,
    )

    # --------------------------------------------------------------
    # Health Endpoint
    # --------------------------------------------------------------
    @app.get(
        "/health",
        tags=["Health"],
        summary="Service health check",
    )
    async def health_check():
        db_status = await check_db_connection()

        return {
            "status": "ok" if db_status else "degraded",
            "app_name": settings.APP_NAME,
            "environment": settings.APP_ENV,
            "database": "connected" if db_status else "unavailable",
        }

    return app


app = create_application()