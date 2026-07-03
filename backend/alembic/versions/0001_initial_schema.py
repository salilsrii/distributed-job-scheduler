"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-07-03

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

UUID_DEFAULT = sa.text("uuid_generate_v4()")

# ---------------------------------------------------------------------------
# Enum type definitions.
# ---------------------------------------------------------------------------

job_status_enum = sa.Enum(
    "pending", "queued", "running", "success", "failed", "cancelled", "retrying",
    name="job_status_enum",
)
execution_status_enum = sa.Enum(
    "running", "success", "failed", "timeout", "cancelled",
    name="execution_status_enum",
)
worker_status_enum = sa.Enum(
    "online", "offline", "busy", "draining",
    name="worker_status_enum",
)
log_level_enum = sa.Enum(
    "debug", "info", "warning", "error", "critical",
    name="log_level_enum",
)
backoff_strategy_enum = sa.Enum(
    "fixed", "linear", "exponential",
    name="backoff_strategy_enum",
)


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # ------------------------------------------------------------------
    # organizations
    # ------------------------------------------------------------------
    op.create_table(
        "organizations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=UUID_DEFAULT),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(255), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("slug", name="uq_organizations_slug"),
    )
    op.create_index("ix_organizations_slug", "organizations", ["slug"])
    op.create_index("ix_organizations_name_not_deleted", "organizations", ["name", "is_deleted"])

    # ------------------------------------------------------------------
    # users
    # ------------------------------------------------------------------
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=UUID_DEFAULT),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("is_superuser", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_organization_id", "users", ["organization_id"])
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_org_email", "users", ["organization_id", "email"])

    # ------------------------------------------------------------------
    # projects
    # ------------------------------------------------------------------
    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=UUID_DEFAULT),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_projects_organization_id", "projects", ["organization_id"])
    op.create_index("ix_projects_org_name", "projects", ["organization_id", "name"], unique=True)

    # ------------------------------------------------------------------
    # queues
    # ------------------------------------------------------------------
    op.create_table(
        "queues",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=UUID_DEFAULT),
        sa.Column("project_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("max_concurrency", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_queues_project_id", "queues", ["project_id"])
    op.create_index("ix_queues_project_name", "queues", ["project_id", "name"], unique=True)

    # ------------------------------------------------------------------
    # workers
    # ------------------------------------------------------------------
    op.create_table(
        "workers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=UUID_DEFAULT),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("hostname", sa.String(255), nullable=False),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("status", worker_status_enum, nullable=False, server_default="offline"),
        sa.Column("capabilities", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_workers_organization_id", "workers", ["organization_id"])
    op.create_index("ix_workers_status", "workers", ["status"])
    op.create_index("ix_workers_org_hostname", "workers", ["organization_id", "hostname"])

    # ------------------------------------------------------------------
    # jobs
    # ------------------------------------------------------------------
    op.create_table(
        "jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=UUID_DEFAULT),
        sa.Column("queue_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("queues.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("payload", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("status", job_status_enum, nullable=False, server_default="pending"),
        sa.Column("priority", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("max_retries", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("timeout_seconds", sa.Integer(), nullable=False, server_default="300"),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_jobs_queue_id", "jobs", ["queue_id"])
    op.create_index("ix_jobs_created_by", "jobs", ["created_by"])
    op.create_index("ix_jobs_status", "jobs", ["status"])
    op.create_index("ix_jobs_queue_status", "jobs", ["queue_id", "status"])
    op.create_index("ix_jobs_priority", "jobs", ["priority"])

    # ------------------------------------------------------------------
    # scheduled_jobs
    # ------------------------------------------------------------------
    op.create_table(
        "scheduled_jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=UUID_DEFAULT),
        sa.Column("job_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("cron_expression", sa.String(120), nullable=False),
        sa.Column("next_run_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_run_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_scheduled_jobs_job_id", "scheduled_jobs", ["job_id"])
    op.create_index("ix_scheduled_jobs_next_run_at", "scheduled_jobs", ["next_run_at"])
    op.create_index("ix_scheduled_jobs_active_next_run", "scheduled_jobs", ["is_active", "next_run_at"])

    # ------------------------------------------------------------------
    # retry_policies
    # ------------------------------------------------------------------
    op.create_table(
        "retry_policies",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=UUID_DEFAULT),
        sa.Column("job_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("max_retries", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("backoff_strategy", backoff_strategy_enum, nullable=False, server_default="exponential"),
        sa.Column("backoff_seconds", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("max_backoff_seconds", sa.Integer(), nullable=False, server_default="3600"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("job_id", name="uq_retry_policies_job_id"),
    )
    op.create_index("ix_retry_policies_job_id", "retry_policies", ["job_id"])

    # ------------------------------------------------------------------
    # worker_heartbeats
    # ------------------------------------------------------------------
    op.create_table(
        "worker_heartbeats",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=UUID_DEFAULT),
        sa.Column("worker_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("workers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", worker_status_enum, nullable=False),
        sa.Column("cpu_usage", sa.Float(), nullable=True),
        sa.Column("memory_usage", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_worker_heartbeats_worker_id", "worker_heartbeats", ["worker_id"])
    op.create_index("ix_worker_heartbeats_worker_created", "worker_heartbeats", ["worker_id", "created_at"])

    # ------------------------------------------------------------------
    # job_executions
    # ------------------------------------------------------------------
    op.create_table(
        "job_executions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=UUID_DEFAULT),
        sa.Column("job_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("worker_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("workers.id", ondelete="SET NULL"), nullable=True),
        sa.Column("status", execution_status_enum, nullable=False, server_default="running"),
        sa.Column("attempt_number", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("result", postgresql.JSONB(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_job_executions_job_id", "job_executions", ["job_id"])
    op.create_index("ix_job_executions_worker_id", "job_executions", ["worker_id"])
    op.create_index("ix_job_executions_status", "job_executions", ["status"])
    op.create_index("ix_job_executions_job_attempt", "job_executions", ["job_id", "attempt_number"])
    op.create_index("ix_job_executions_worker_status", "job_executions", ["worker_id", "status"])

    # ------------------------------------------------------------------
    # job_logs
    # ------------------------------------------------------------------
    op.create_table(
        "job_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=UUID_DEFAULT),
        sa.Column("job_execution_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("job_executions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("log_level", log_level_enum, nullable=False, server_default="info"),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_job_logs_job_execution_id", "job_logs", ["job_execution_id"])
    op.create_index("ix_job_logs_log_level", "job_logs", ["log_level"])
    op.create_index("ix_job_logs_execution_created", "job_logs", ["job_execution_id", "created_at"])

    # ------------------------------------------------------------------
    # dead_letter_queue
    # ------------------------------------------------------------------
    op.create_table(
        "dead_letter_queue",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=UUID_DEFAULT),
        sa.Column("job_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("job_execution_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("job_executions.id", ondelete="SET NULL"), nullable=True),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("payload_snapshot", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("failed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("job_execution_id", name="uq_dlq_job_execution_id"),
    )
    op.create_index("ix_dead_letter_queue_job_id", "dead_letter_queue", ["job_id"])
    op.create_index("ix_dlq_job_failed_at", "dead_letter_queue", ["job_id", "failed_at"])


def downgrade() -> None:
    # Drop tables in reverse dependency order first.
    op.drop_table("dead_letter_queue")
    op.drop_table("job_logs")
    op.drop_table("job_executions")
    op.drop_table("worker_heartbeats")
    op.drop_table("retry_policies")
    op.drop_table("scheduled_jobs")
    op.drop_table("jobs")
    op.drop_table("workers")
    op.drop_table("queues")
    op.drop_table("projects")
    op.drop_table("users")
    op.drop_table("organizations")

    # Then drop the enum types, exactly once each, via raw DDL
    # (never via the Python-side enum.drop() method).
    op.execute("DROP TYPE IF EXISTS backoff_strategy_enum")
    op.execute("DROP TYPE IF EXISTS log_level_enum")
    op.execute("DROP TYPE IF EXISTS worker_status_enum")
    op.execute("DROP TYPE IF EXISTS execution_status_enum")
    op.execute("DROP TYPE IF EXISTS job_status_enum")