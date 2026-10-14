from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from models.book import Book, Vol
from schemas.book import BookCreate, BookUpdate


class BookService:
    def __init__(self, db: Session):
        self.db = db

    def get_ids(self) -> list[int]:
        return self.db.execute(select(Book.id)).scalars().all()

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

    def create(self, data: BookCreate) -> Book:
        book = Book(**data.model_dump())
        self.db.add(book)
        self.db.commit()
        self.db.refresh(book)
        return book

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
