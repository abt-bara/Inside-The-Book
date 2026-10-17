from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from config import settings

_url = settings.database_url
if _url.startswith("postgresql://"):
    _url = _url.replace("postgresql://", "postgresql+psycopg://", 1)

_connect_args: dict = {}

if _url.startswith("sqlite"):
    _connect_args["check_same_thread"] = False
elif ":6543/" in _url:
    _connect_args["prepare_threshold"] = None

engine = create_engine(
    _url,
    connect_args=_connect_args,
    pool_pre_ping=True,
    echo=settings.debug,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    """FastAPI dependency: one session per request, always closed."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
