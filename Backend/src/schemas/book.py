from pydantic import BaseModel, ConfigDict


class VolImageSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    image_url: str


class BookImageSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    image_url: str


class VolSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    number: int
    images: list[VolImageSchema] = []


class BookSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    author: str
    editor: str
    distributor: str
    description: str
    year: str
    new: bool
    vols: list[VolSchema] = []
    images: list[BookImageSchema] = []


class BookCreate(BaseModel):
    title: str
    author: str = ""
    editor: str = ""
    distributor: str = ""
    description: str = ""
    year: str = ""
    new: bool = False


class BookUpdate(BaseModel):
    title: str | None = None
    author: str | None = None
    editor: str | None = None
    distributor: str | None = None
    description: str | None = None
    year: str | None = None
    new: bool | None = None
