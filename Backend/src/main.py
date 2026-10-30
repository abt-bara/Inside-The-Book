from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api_config import API_CONFIG
from config import settings
from db import engine
from routers import books, login

app = FastAPI(debug=settings.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(login.router)
app.include_router(books.router)


@app.get(f"{API_CONFIG['apiPrefix']}{API_CONFIG['api']['health']}")
def health():
    return {"status": "healthy"}
