import json
import logging
from collections.abc import Callable, Mapping
from typing import Protocol, TypeVar, runtime_checkable
from uuid import uuid4

from fastapi import HTTPException
from pydantic import BaseModel, ValidationError
from starlette.datastructures import UploadFile

from schemas.book import UploadedImage
from services.image_storage import (
    IMAGE_CONTENT_TYPES,
    MAX_IMAGE_FILES,
    MAX_IMAGE_SIZE,
    ImageStorage,
    SupabaseImageStorage,
)

logger = logging.getLogger(__name__)


@runtime_checkable
class ImageSlotPayload(Protocol):
    def referenced_slots(self) -> list[str]: ...


PayloadT = TypeVar("PayloadT", bound=BaseModel)
ResultT = TypeVar("ResultT")


def process_image_upload(
    payload_raw: str,
    files: Mapping[str, UploadFile],
    payload_type: type[PayloadT],
    storage: ImageStorage | None,
    persist: Callable[[PayloadT, Mapping[str, UploadedImage]], ResultT],
) -> ResultT:
    try:
        payload = payload_type.model_validate(json.loads(payload_raw))
    except (json.JSONDecodeError, ValidationError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    if not isinstance(payload, ImageSlotPayload):
        raise TypeError(
            f"{payload_type.__name__} must implement referenced_slots()."
        )

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

    image_data: dict[str, tuple[bytes, str]] = {}
    for slot, upload in files.items():
        content_type = upload.content_type
        if content_type not in IMAGE_CONTENT_TYPES:
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
        image_data[slot] = (file_bytes, content_type)

    uploaded_keys: list[str] = []
    uploaded_images: dict[str, UploadedImage] = {}
    image_storage = storage
    try:
        if image_data:
            if image_storage is None:
                image_storage = SupabaseImageStorage()
            upload_id = str(uuid4())
            for slot, (file_bytes, content_type) in image_data.items():
                extension = IMAGE_CONTENT_TYPES[content_type]
                storage_key, public_url = image_storage.upload(
                    file_bytes,
                    f"books/{upload_id}/{slot}.{extension}",
                    content_type,
                )
                uploaded_keys.append(storage_key)
                uploaded_images[slot] = UploadedImage(
                    image_url=public_url,
                    storage_key=storage_key,
                )

        return persist(payload, uploaded_images)
    except Exception:
        if uploaded_keys and image_storage is not None:
            try:
                image_storage.delete(uploaded_keys)
            except Exception:
                logger.exception(
                    "Failed to remove uploaded images after request processing failed."
                )
        raise
