"""
Logging configuration module.

Configures a structured, consistent logging format for the entire
application, including Uvicorn's own loggers.
"""

import logging
import sys
from logging import Logger

from app.core.config import get_settings

settings = get_settings()


LOG_FORMAT = (
    "%(asctime)s | %(levelname)-8s | %(name)s | "
    "%(filename)s:%(lineno)d | %(message)s"
)
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def configure_logging() -> None:
    """
    Configure root logging handlers and formatters.

    This should be called once, during application startup, before
    any other module emits log records.
    """
    log_level = settings.LOG_LEVEL.upper()

    formatter = logging.Formatter(fmt=LOG_FORMAT, datefmt=DATE_FORMAT)

    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Avoid duplicate handlers on reload (e.g. uvicorn --reload)
    root_logger.handlers.clear()
    root_logger.addHandler(stream_handler)

    # Align Uvicorn's loggers with our format
    for uvicorn_logger_name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        uvicorn_logger = logging.getLogger(uvicorn_logger_name)
        uvicorn_logger.handlers.clear()
        uvicorn_logger.addHandler(stream_handler)
        uvicorn_logger.propagate = False
        uvicorn_logger.setLevel(log_level)

    # SQLAlchemy engine logging (only verbose in debug mode)
    sqlalchemy_logger = logging.getLogger("sqlalchemy.engine")
    sqlalchemy_logger.setLevel(logging.INFO if settings.APP_DEBUG else logging.WARNING)


def get_logger(name: str) -> Logger:
    """
    Return a named logger instance.

    Args:
        name: Typically __name__ of the calling module.
    """
    return logging.getLogger(name)