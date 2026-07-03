"""
Authentication service.

Handles user authentication, demo account auto-creation, token generation, and registration.
"""

from datetime import timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
    settings,
)
from app.models.organization import Organization
from app.models.user import User
from app.repositories.organization_repository import OrganizationRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest


class AuthService:
    """Service for handling user authentication and token issuance."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_repo = UserRepository(session)
        self.org_repo = OrganizationRepository(session)

    def _user_to_dict(self, user: User) -> dict:
        return {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "organization_id": str(user.organization_id),
            "is_active": user.is_active,
            "is_superuser": user.is_superuser,
        }

    async def _ensure_default_org(
        self,
        name: str = "Demo Organization",
    ) -> Organization:
        slug = name.lower().replace(" ", "-")

        org = await self.org_repo.get_by_slug(slug)

        if not org:
            org = await self.org_repo.create(
                name=name,
                slug=slug,
            )
            await self.session.flush()

        return org

    async def login(self, data: LoginRequest) -> dict:
        user = await self.user_repo.get_by_email(data.email)

        if not user and data.email.lower() == "admin@example.com":
            org = await self._ensure_default_org()

            hashed_pwd = get_password_hash("password")

            user = await self.user_repo.create(
                organization_id=org.id,
                email="admin@example.com",
                full_name="Demo Admin",
                hashed_password=hashed_pwd,
                is_active=True,
                is_superuser=True,
            )

            await self.session.commit()

        elif not user:
            raise ValueError("Invalid email or password")

        elif not verify_password(
            data.password,
            user.hashed_password,
        ):
            raise ValueError("Invalid email or password")

        access_token = create_access_token(
            subject=user.email,
            expires_delta=timedelta(
                minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
            ),
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": self._user_to_dict(user),
        }

    async def register(self, data: RegisterRequest) -> dict:
        print("========== REGISTER START ==========")

        existing = await self.user_repo.get_by_email(data.email)

        if existing:
            raise ValueError("Email already registered")

        org = await self._ensure_default_org(
            data.organization_name,
        )

        print("PASSWORD:", repr(data.password))
        print("TYPE:", type(data.password))
        print("LENGTH:", len(data.password))

        hashed_pwd = get_password_hash(data.password)

        print("HASH GENERATED")

        user = await self.user_repo.create(
            organization_id=org.id,
            email=data.email.lower(),
            full_name=data.full_name,
            hashed_password=hashed_pwd,
            is_active=True,
            is_superuser=False,
        )

        print("USER CREATED")

        await self.session.commit()

        print("COMMIT DONE")

        access_token = create_access_token(
            subject=user.email,
            expires_delta=timedelta(
                minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
            ),
        )

        print("========== REGISTER END ==========")

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": self._user_to_dict(user),
        }