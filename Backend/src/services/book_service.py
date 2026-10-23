from collections.abc import Mapping

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from starlette.datastructures import UploadFile

from models.book import Book, BookImage, Vol, VolImage
from schemas.book import (
    BookCreateWithSlots,
    BookCreateWithVols,
    BookUpdate,
    BookUpdateWithSlots,
    UploadedImage,
)
from services.image_storage import ImageStorage
from utils.image_upload import process_image_upload


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
        def persist(
            payload: BookCreateWithSlots,
            uploaded_images: Mapping[str, UploadedImage],
        ) -> Book:
            return self.create(payload.to_book_create(uploaded_images))

        return process_image_upload(
            payload_raw,
            files,
            BookCreateWithSlots,
            self.storage,
            persist,
        )

    def update(self, book_id: int, data: BookUpdate) -> Book | None:
        book = self.get_by_id(book_id)
        if book is None:
            return None

        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(book, field, value)

        self.db.commit()
        self.db.refresh(book)
        return book

    def update_with_files(
        self,
        book_id: int,
        payload_raw: str,
        files: dict[str, UploadFile],
    ) -> Book | None:
        book = self.get_by_id(book_id)
        if book is None:
            return None

        def persist(
            payload: BookUpdateWithSlots,
            uploaded_images: Mapping[str, UploadedImage],
        ) -> Book:
            volume_ids = {volume.id for volume in book.vols}
            invalid_volume_ids = sorted(
                {
                    volume.vol_id
                    for volume in payload.vols
                    if volume.vol_id not in volume_ids
                }
            )
            if invalid_volume_ids:
                raise HTTPException(
                    status_code=422,
                    detail={
                        "invalid_volume_ids": invalid_volume_ids,
                        "message": "Volume images must reference volumes belonging to this book.",
                    },
                )

            fields = payload.model_dump(
                exclude_unset=True,
                exclude={"images", "vols"},
            )
            volumes = {volume.id: volume for volume in book.vols}
            try:
                for field, value in fields.items():
                    setattr(book, field, value)

                book.images.extend(
                    BookImage(
                        image_url=uploaded_images[image.slot].image_url,
                        storage_key=uploaded_images[image.slot].storage_key,
                    )
                    for image in payload.images
                )
                for volume_payload in payload.vols:
                    volume = volumes[volume_payload.vol_id]
                    volume.images.extend(
                        VolImage(
                            image_url=uploaded_images[image.slot].image_url,
                            storage_key=uploaded_images[image.slot].storage_key,
                        )
                        for image in volume_payload.images
                    )
                self.db.commit()
            except Exception:
                self.db.rollback()
                raise

            updated_book = self.get_by_id(book_id)
            if updated_book is None:
                raise RuntimeError("Updated book disappeared after commit.")
            return updated_book

        return process_image_upload(
            payload_raw,
            files,
            BookUpdateWithSlots,
            self.storage,
            persist,
        )

    def delete(self, book_id: int) -> bool:
        book = self.get_by_id(book_id)
        if book is None:
            return False

        self.db.delete(book)
        self.db.commit()
        return True
