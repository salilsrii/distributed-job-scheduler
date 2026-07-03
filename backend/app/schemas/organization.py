from uuid import UUID

from pydantic import BaseModel, ConfigDict


class OrganizationCreate(BaseModel):
    name: str
    slug: str


class OrganizationUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None


class OrganizationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str