"""
Central import point for all ORM models.

Importing this module registers every model on Base.metadata,
which is required for Alembic autogenerate to detect them.
"""

from app.db.base import Base
from app.models.dead_letter_queue import DeadLetterQueue
from app.models.job import Job
from app.models.job_execution import JobExecution
from app.models.job_log import JobLog
from app.models.organization import Organization
from app.models.project import Project
from app.models.queue import Queue
from app.models.retry_policy import RetryPolicy
from app.models.scheduled_job import ScheduledJob
from app.models.user import User
from app.models.worker import Worker
from app.models.worker_heartbeat import WorkerHeartbeat

__all__ = [
    "Base",
    "Organization",
    "User",
    "Project",
    "Queue",
    "Job",
    "ScheduledJob",
    "RetryPolicy",
    "Worker",
    "WorkerHeartbeat",
    "JobExecution",
    "JobLog",
    "DeadLetterQueue",
]