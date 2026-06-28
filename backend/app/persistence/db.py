from sqlmodel import SQLModel, Session, create_engine
from typing import Generator
import os

# Load database URL from environment variables, defaulting to a local path
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///database.db")

# Disable same-thread checks for SQLite compatibility in multi-threaded FastAPI environments
# Configure a default timeout of 30.0 seconds to queue concurrent write attempts (ADR-002 / ES Risk 2.1)
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False, "timeout": 30.0}

engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=False)

def init_db() -> None:
    """Creates database tables defined by SQLModel if they do not exist."""
    # Import models here to ensure metadata is registered before creation
    from app.persistence.models import ProfileTable, EducationTable
    SQLModel.metadata.create_all(engine)

def get_session() -> Generator[Session, None, None]:
    """FastAPI dependency that yields an active database session and ensures clean closure."""
    with Session(engine) as session:
        yield session
