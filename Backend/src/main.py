from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from db import engine
from routers import books, login

if settings.database_url.startswith("sqlite"):
    from models.base import Base
    import models.book  # noqa: F401

    Base.metadata.create_all(bind=engine)

app = FastAPI(debug=settings.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(login.router)
app.include_router(books.router)


@app.get("/health")
def health():
    return {"status": "healthy"}
