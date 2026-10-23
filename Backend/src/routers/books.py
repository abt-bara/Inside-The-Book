import json
from dataclasses import dataclass

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import ValidationError
from sqlalchemy.orm import Session
from starlette.datastructures import UploadFile
from starlette.formparsers import MultiPartException
from starlette.requests import Request

from api_config import API_CONFIG
from db import get_db
from schemas.book import BookSchema, BookUpdate
from services.book_service import BookService
from services.image_storage import MAX_IMAGE_FILES

router = APIRouter(prefix=API_CONFIG["apiPrefix"], tags=["books"])


@dataclass
class BookUploadData:
    payload_raw: str
    files: dict[str, UploadFile]


def get_service(db: Session = Depends(get_db)) -> BookService:
    return BookService(db)


async def parse_book_upload(request: Request) -> BookUploadData:
    try:
        form = await request.form(max_files=MAX_IMAGE_FILES + 1)
    except MultiPartException as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    payload_values: list[str] = []
    files: dict[str, UploadFile] = {}
    for name, value in form.multi_items():
        if name == "payload":
            if not isinstance(value, str):
                raise HTTPException(
                    status_code=422,
                    detail="The 'payload' field must be a JSON string.",
                )
            payload_values.append(value)
        elif isinstance(value, UploadFile):
            if name in files:
                raise HTTPException(
                    status_code=422,
                    detail=f"File slot '{name}' was submitted more than once.",
                )
            files[name] = value
        else:
            raise HTTPException(
                status_code=422,
                detail=f"Unexpected form field '{name}'.",
            )

    if len(payload_values) != 1:
        raise HTTPException(
            status_code=422,
            detail="Exactly one 'payload' field is required.",
        )
    if len(files) > MAX_IMAGE_FILES:
        raise HTTPException(
            status_code=422,
            detail=f"A book request may include at most {MAX_IMAGE_FILES} image files.",
        )
    return BookUploadData(payload_raw=payload_values[0], files=files)


@router.get(API_CONFIG["api"]["books"], response_model=list[BookSchema])
def get_books(service: BookService = Depends(get_service)) -> list[BookSchema]:
    return service.get_all()


@router.get(API_CONFIG["api"]["book"], response_model=BookSchema)
def get_book(book_id: int, service: BookService = Depends(get_service)):
    book = service.get_by_id(book_id)
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@router.post(
    API_CONFIG["api"]["books"],
    response_model=BookSchema,
    status_code=status.HTTP_201_CREATED,
    openapi_extra={
        "requestBody": {
            "required": True,
            "content": {
                "multipart/form-data": {
                    "schema": {
                        "type": "object",
                        "required": ["payload"],
                        "properties": {
                            "payload": {
                                "type": "string",
                                "description": (
                                    "JSON matching BookCreateWithSlots. Image entries "
                                    "contain a slot field referencing a file field."
                                ),
                            }
                        },
                        "additionalProperties": {
                            "type": "string",
                            "format": "binary",
                        },
                    }
                }
            },
        }
    },
)
def create_book(
    upload: BookUploadData = Depends(parse_book_upload),
    service: BookService = Depends(get_service),
):
    return service.create_with_files(upload.payload_raw, upload.files)


@router.patch(
    API_CONFIG["api"]["book"],
    response_model=BookSchema,
    openapi_extra={
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "author": {"type": "string"},
                            "editor": {"type": "string"},
                            "distributor": {"type": "string"},
                            "description": {"type": "string"},
                            "year": {"type": "string"},
                            "new": {"type": "boolean"},
                        },
                    }
                },
                "multipart/form-data": {
                    "schema": {
                        "type": "object",
                        "required": ["payload"],
                        "properties": {
                            "payload": {
                                "type": "string",
                                "description": (
                                    "JSON matching BookUpdateWithSlots. Image entries "
                                    "use slots; each volume entry identifies an existing "
                                    "volume with vol_id."
                                ),
                            }
                        },
                        "additionalProperties": {
                            "type": "string",
                            "format": "binary",
                        },
                    }
                },
            },
        }
    },
)
async def update_book(
    book_id: int,
    request: Request,
    service: BookService = Depends(get_service),
):
    if request.headers.get("content-type", "").lower().startswith(
        "multipart/form-data"
    ):
        upload = await parse_book_upload(request)
        book = service.update_with_files(
            book_id,
            upload.payload_raw,
            upload.files,
        )
    else:
        try:
            data = BookUpdate.model_validate(await request.json())
        except (json.JSONDecodeError, ValidationError) as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        book = service.update(book_id, data)

    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@router.delete(API_CONFIG["api"]["book"], status_code=status.HTTP_204_NO_CONTENT)
def delete_book(book_id: int, service: BookService = Depends(get_service)):
    deleted = service.delete(book_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Book not found")
    return None
