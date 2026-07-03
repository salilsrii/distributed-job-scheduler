"""
Shared FastAPI dependencies.
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

settings = get_settings()
security_scheme = HTTPBearer(auto_error=False)


async def get_user_repository(
    session: AsyncSession = Depends(get_db),
) -> UserRepository:
    return UserRepository(session)


async def get_current_user(
    auth_header: Annotated[HTTPAuthorizationCredentials | None, Depends(security_scheme)] = None,
    repository: UserRepository = Depends(get_user_repository),
) -> User:
    """
    Returns the currently authenticated user by extracting token from Authorization: Bearer header.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if auth_header is None or not auth_header.credentials:
        raise credentials_exception
    token = auth_header.credentials

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        user_email = payload.get("sub")

        if user_email is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = await repository.get_by_email(user_email)

    if user is None:
        raise credentials_exception

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]