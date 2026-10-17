import json
import logging
from uuid import uuid4

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from starlette.datastructures import UploadFile

from models.book import Book, BookImage, Vol, VolImage
from schemas.book import (
    BookCreateWithSlots,
    BookCreateWithVols,
    BookUpdate,
    UploadedImage,
)
from services.image_storage import (
    IMAGE_CONTENT_TYPES,
    MAX_IMAGE_FILES,
    MAX_IMAGE_SIZE,
    ImageStorage,
    SupabaseImageStorage,
)

logger = logging.getLogger(__name__)


class BookService:
    def __init__(
        self,
        db: Session,
        storage: ImageStorage | None = None,
    ):
        self.db = db
        self.storage = storage

    def get_all(self) -> list[Book]:
        stmt = select(Book).options(
            selectinload(Book.vols).selectinload(Vol.images),
            selectinload(Book.images),
        )
        return self.db.execute(stmt).scalars().all()

    def get_by_id(self, book_id: int) -> Book | None:
        stmt = select(Book).where(Book.id == book_id).options(
            selectinload(Book.vols).selectinload(Vol.images),
            selectinload(Book.images),
        )
        return self.db.execute(stmt).scalars().first()

    def create(self, data: BookCreateWithVols) -> Book:
        book = Book(
            **data.model_dump(exclude={"vols", "images"}),
            vols=[
                Vol(
                    title=vol.title,
                    number=vol.number,
                    images=[
                        VolImage(
                            image_url=image.image_url,
                            storage_key=image.storage_key,
                        )
                        for image in vol.images
                    ],
                )
                for vol in data.vols
            ],
            images=[
                BookImage(
                    image_url=image.image_url,
                    storage_key=image.storage_key,
                )
                for image in data.images
            ],
        )
        self.db.add(book)
        try:
            self.db.flush()
            book_id = book.id
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

        stmt = select(Book).where(Book.id == book_id).options(
            selectinload(Book.vols).selectinload(Vol.images),
            selectinload(Book.images),
        )
        return self.db.execute(stmt).scalars().one()

    def create_with_files(
        self,
        payload_raw: str,
        files: dict[str, UploadFile],
    ) -> Book:
        try:
            payload = BookCreateWithSlots.model_validate(json.loads(payload_raw))
        except (json.JSONDecodeError, ValidationError) as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

        slots = payload.referenced_slots()
        if len(slots) > MAX_IMAGE_FILES or len(files) > MAX_IMAGE_FILES:
            raise HTTPException(
                status_code=422,
                detail=f"A book request may include at most {MAX_IMAGE_FILES} image files.",
            )
        if len(slots) != len(set(slots)):
            raise HTTPException(
                status_code=422,
                detail="Each image slot may be referenced only once.",
            )

        missing_slots = set(slots) - files.keys()
        extra_files = files.keys() - set(slots)
        if missing_slots or extra_files:
            raise HTTPException(
                status_code=422,
                detail={
                    "missing_slots": sorted(missing_slots),
                    "unreferenced_files": sorted(extra_files),
                },
            )

        for slot, upload in files.items():
            if upload.content_type not in IMAGE_CONTENT_TYPES:
                raise HTTPException(
                    status_code=422,
                    detail=f"Unsupported content type for image slot '{slot}'.",
                )
            upload.file.seek(0)
            file_bytes = upload.file.read(MAX_IMAGE_SIZE + 1)
            upload.file.seek(0)
            if len(file_bytes) > MAX_IMAGE_SIZE:
                raise HTTPException(
                    status_code=422,
                    detail=f"Image slot '{slot}' exceeds the 5 MB limit.",
                )

        if not slots:
            return self.create(payload.to_book_create({}))

        storage = self.storage or SupabaseImageStorage()
        uploaded_keys: list[str] = []
        uploaded_images: dict[str, UploadedImage] = {}
        book_upload_id = str(uuid4())
        try:
            for slot in slots:
                upload = files[slot]
                content_type = upload.content_type
                if content_type not in IMAGE_CONTENT_TYPES:
                    raise HTTPException(
                        status_code=422,
                        detail=f"Unsupported content type for image slot '{slot}'.",
                    )
                extension = IMAGE_CONTENT_TYPES[content_type]
                key = f"books/{book_upload_id}/{slot}.{extension}"
                upload.file.seek(0)
                file_bytes = upload.file.read(MAX_IMAGE_SIZE + 1)
                if len(file_bytes) > MAX_IMAGE_SIZE:
                    raise HTTPException(
                        status_code=422,
                        detail=f"Image slot '{slot}' exceeds the 5 MB limit.",
                    )
                storage_key, public_url = storage.upload(
                    file_bytes,
                    key,
                    content_type,
                )
                uploaded_keys.append(storage_key)
                uploaded_images[slot] = UploadedImage(
                    image_url=public_url,
                    storage_key=storage_key,
                )

            data = payload.to_book_create(uploaded_images)
            return self.create(data)
        except Exception:
            if uploaded_keys:
                try:
                    storage.delete(uploaded_keys)
                except Exception:
                    logger.exception(
                        "Failed to remove uploaded book images after book creation failed."
                    )
            raise

    def update(self, book_id: int, data: BookUpdate) -> Book | None:
        book = self.get_by_id(book_id)
        if book is None:
            return None

        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(book, field, value)

        self.db.commit()
        self.db.refresh(book)
        return book

    def delete(self, book_id: int) -> bool:
        book = self.get_by_id(book_id)
        if book is None:
            return False

        self.db.delete(book)
        self.db.commit()
        return True
