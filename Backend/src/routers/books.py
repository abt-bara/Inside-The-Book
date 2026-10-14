from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db import get_db
from schemas.book import BookCreate, BookSchema, BookUpdate
from services.book_service import BookService

router = APIRouter(prefix="/books", tags=["books"])


def get_service(db: Session = Depends(get_db)) -> BookService:
    return BookService(db)


@router.get("/ids", response_model=list[int])
def get_book_ids(service: BookService = Depends(get_service)) -> list[int]:
    return service.get_ids()


@router.get("", response_model=list[BookSchema])
def get_books(service: BookService = Depends(get_service)) -> list[BookSchema]:
    return service.get_all()


@router.get("/{book_id}", response_model=BookSchema)
def get_book(book_id: int, service: BookService = Depends(get_service)):
    book = service.get_by_id(book_id)
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@router.post("", response_model=BookSchema, status_code=status.HTTP_201_CREATED)
def create_book(data: BookCreate, service: BookService = Depends(get_service)):
    return service.create(data)


@router.patch("/{book_id}", response_model=BookSchema)
def update_book(
    book_id: int,
    data: BookUpdate,
    service: BookService = Depends(get_service),
):
    book = service.update(book_id, data)
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(book_id: int, service: BookService = Depends(get_service)):
    deleted = service.delete(book_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Book not found")
    return None
