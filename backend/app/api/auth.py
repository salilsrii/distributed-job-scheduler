"""
Authentication API router.

Exposes authentication and token endpoints under /api/v1/auth.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser
from app.db.session import get_db
from app.schemas.auth import LoginRequest, RegisterRequest, Token
from app.services.auth_service import AuthService

router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
)


@router.post("/login", response_model=Token)
async def login(
    data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await AuthService(db).login(data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await AuthService(db).register(data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/me")
async def get_me(current_user: CurrentUser):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "organization_id": str(current_user.organization_id),
        "is_active": current_user.is_active,
        "is_superuser": current_user.is_superuser,
    }


@router.post("/logout")
async def logout():
    return {"success": True, "message": "Logged out successfully"}


@router.post("/refresh", response_model=Token)
async def refresh_token(current_user: CurrentUser):
    from datetime import timedelta
    from app.core.security import create_access_token, settings
    access_token = create_access_token(
        subject=current_user.email,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "full_name": current_user.full_name,
            "organization_id": str(current_user.organization_id),
            "is_active": current_user.is_active,
            "is_superuser": current_user.is_superuser,
        },
    }


users_router = APIRouter(prefix="/users", tags=["Users"])


@users_router.get("/me")
async def get_user_me(current_user: CurrentUser):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "organization_id": str(current_user.organization_id),
        "is_active": current_user.is_active,
        "is_superuser": current_user.is_superuser,
    }


@users_router.put("/me")
@users_router.patch("/me")
async def update_user_me(
    data: dict, current_user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    if "full_name" in data and data["full_name"]:
        current_user.full_name = data["full_name"]
    if "email" in data and data["email"]:
        current_user.email = data["email"]
    await db.commit()
    await db.refresh(current_user)
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "organization_id": str(current_user.organization_id),
        "is_active": current_user.is_active,
        "is_superuser": current_user.is_superuser,
    }


@users_router.post("/me/change-password")
async def change_password(
    data: dict, current_user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    from app.core.security import get_password_hash, verify_password

    old_pass = data.get("current_password", "")
    new_pass = data.get("new_password", "")
    if not verify_password(old_pass, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    current_user.hashed_password = get_password_hash(new_pass)
    await db.commit()
    return {"success": True}


@users_router.get("/me/tokens")
async def list_tokens():
    return []


@users_router.post("/me/tokens")
async def create_token(data: dict):
    import secrets
    import uuid

    return {
        "id": str(uuid.uuid4()),
        "name": data.get("name", "API Token"),
        "token": "sk_" + secrets.token_urlsafe(24),
        "created_at": "2026-07-03T00:00:00Z",
    }


@users_router.delete("/me/tokens/{id}")
async def revoke_token(id: str):
    return {"success": True}

