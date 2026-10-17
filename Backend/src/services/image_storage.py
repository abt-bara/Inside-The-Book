from typing import Protocol

from supabase import create_client

from config import settings

MAX_IMAGE_SIZE = 5 * 1024 * 1024
MAX_IMAGE_FILES = 200
IMAGE_CONTENT_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}


class ImageStorage(Protocol):
    def upload(
        self,
        data: bytes,
        key: str,
        content_type: str,
    ) -> tuple[str, str]: ...

    def delete(self, keys: list[str]) -> None: ...


class SupabaseImageStorage:
    def __init__(self) -> None:
        values = {
            "SUPABASE_URL": settings.supabase_url,
            "SUPABASE_KEY": settings.supabase_key,
            "SUPABASE_BUCKET": settings.supabase_bucket,
        }
        missing = [name for name, value in values.items() if not value]
        if missing:
            raise RuntimeError(
                f"Missing required Supabase environment variables: {', '.join(missing)}"
            )

        self.bucket = settings.supabase_bucket
        print(repr(settings.supabase_url))
        self.client = create_client(
            settings.supabase_url,
            settings.supabase_key,
        )

    def upload(
        self,
        data: bytes,
        key: str,
        content_type: str,
    ) -> tuple[str, str]:
        bucket = self.client.storage.from_(self.bucket)
        public_url = bucket.get_public_url(key)
        bucket.upload(
            key,
            data,
            file_options={
                "content-type": content_type,
                "upsert": "false",
            },
        )
        return key, public_url

    def delete(self, keys: list[str]) -> None:
        if keys:
            self.client.storage.from_(self.bucket).remove(keys)
