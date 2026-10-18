import json
from pathlib import Path
from typing import TypedDict


class PageRoutes(TypedDict):
    books: str
    bookDetail: str


class ApiRoutes(TypedDict):
    books: str
    book: str
    login: str
    health: str


class ApiConfig(TypedDict):
    apiPrefix: str
    pages: PageRoutes
    api: ApiRoutes


API_CONFIG: ApiConfig = json.loads(
    (Path(__file__).resolve().parents[2] / "shared" / "api-config.json").read_text()
)
