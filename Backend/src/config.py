from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    allowed_origins: list[str]
    database_url: str = "sqlite:///./books.db"
    debug: bool = False
    supabase_url: str = ""
    supabase_key: str = ""
    supabase_bucket: str = ""

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
    )


settings = Settings()
