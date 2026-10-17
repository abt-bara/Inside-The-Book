from collections.abc import Mapping

from pydantic import BaseModel, ConfigDict, Field


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


class VolImageCreate(BaseModel):
    image_url: str
    storage_key: str | None = None


class VolCreate(BaseModel):
    title: str
    number: int
    images: list[VolImageCreate] = Field(default_factory=list)


class BookImageCreate(BaseModel):
    image_url: str
    storage_key: str | None = None


class BookCreateWithVols(BookCreate):
    vols: list[VolCreate] = Field(default_factory=list)
    images: list[BookImageCreate] = Field(default_factory=list)


class ImageSlotRef(BaseModel):
    slot: str = Field(pattern=r"^[A-Za-z0-9_-]{1,100}$")


class VolWithImageSlots(BaseModel):
    title: str
    number: int
    images: list[ImageSlotRef] = Field(default_factory=list)


class BookCreateWithSlots(BookCreate):
    vols: list[VolWithImageSlots] = Field(default_factory=list)
    images: list[ImageSlotRef] = Field(default_factory=list)

    def referenced_slots(self) -> list[str]:
        
        return [
            *(image.slot for image in self.images),
            *(
                image.slot
                for vol in self.vols
                for image in vol.images
            ),
        ]
        
    def to_book_create(
        self,
        uploaded_images: Mapping[str, "UploadedImage"],
    ) -> BookCreateWithVols:
        data = self.model_dump()
        data["images"] = [
            {
                "image_url": uploaded_images[image["slot"]].image_url,
                "storage_key": uploaded_images[image["slot"]].storage_key,
            }
            for image in data["images"]
        ]
        for vol in data["vols"]:
            vol["images"] = [
                {
                    "image_url": uploaded_images[image["slot"]].image_url,
                    "storage_key": uploaded_images[image["slot"]].storage_key,
                }
                for image in vol["images"]
            ]
        return BookCreateWithVols.model_validate(data)


class UploadedImage(BaseModel):
    image_url: str
    storage_key: str


class BookUpdate(BaseModel):
    title: str | None = None
    author: str | None = None
    editor: str | None = None
    distributor: str | None = None
    description: str | None = None
    year: str | None = None
    new: bool | None = None
