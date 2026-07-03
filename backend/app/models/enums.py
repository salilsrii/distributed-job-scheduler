"""
Shared enumeration types used across job scheduler models.
"""

import enum


class JobStatus(str, enum.Enum):
    PENDING = "pending"
    QUEUED = "queued"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"
    RETRYING = "retrying"


class ExecutionStatus(str, enum.Enum):
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    TIMEOUT = "timeout"
    CANCELLED = "cancelled"


class WorkerStatus(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    BUSY = "busy"
    DRAINING = "draining"


class LogLevel(str, enum.Enum):
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class BackoffStrategy(str, enum.Enum):
    FIXED = "fixed"
    LINEAR = "linear"
    EXPONENTIAL = "exponential"