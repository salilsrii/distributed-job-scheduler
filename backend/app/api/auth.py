"""
Authentication API router.

Exposes authentication and token endpoints under /api/v1/auth.
"""

from fastapi import APIRouter

router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
)
