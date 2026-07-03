"""
Shared FastAPI dependencies.
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository

settings = get_settings()

# OAuth2 Bearer authentication
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/token",
)


async def get_user_repository(
    session: AsyncSession = Depends(get_db),
) -> UserRepository:
    return UserRepository(session)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    repository: UserRepository = Depends(get_user_repository),
) -> User:
    """
    Returns the currently authenticated user.
    """
    print(f"DEBUG [get_current_user] Raw Bearer token: {token!r}")
    print(f"DEBUG [get_current_user] SECRET_KEY (first 10 chars): {settings.SECRET_KEY[:10]!r}")
    print(f"DEBUG [get_current_user] ALGORITHM: {settings.ALGORITHM!r}")

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        print(f"DEBUG [get_current_user] Decoded JWT payload: {payload!r}")

        user_email = payload.get("sub")
        print(f"DEBUG [get_current_user] Sub claim: {user_email!r}")

        if user_email is None:
            print("DEBUG [get_current_user] Sub claim is None, raising 401")
            raise credentials_exception

    except JWTError as e:
        print(f"DEBUG [get_current_user] JWT decode failed with error: {e}")
        raise credentials_exception

    user = await repository.get_by_email(user_email)
    print(f"DEBUG [get_current_user] repository.get_by_email() returned user: {user is not None}")

    if user is None:
        raise credentials_exception

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]