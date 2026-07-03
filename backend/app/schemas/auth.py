"""
Authentication and token schemas.
"""

from uuid import UUID
from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict | None = None


class TokenPayload(BaseModel):
    sub: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str = "Demo User"
    organization_name: str = "Demo Organization"


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    organization_id: UUID
    is_active: bool
    is_superuser: bool