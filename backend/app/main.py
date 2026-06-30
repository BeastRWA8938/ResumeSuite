from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.persistence.db import init_db
from app.api.profile import router as profile_router
from app.api.education import router as education_router
from app.api.work_experience import router as work_experience_router
from app.api.project import router as project_router
from app.api.hackathon import router as hackathon_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database and map SQLModel schema tables
    init_db()
    yield

app = FastAPI(
    title="Career Intelligence System API",
    description="Local-First Career Memory and Resume Tailoring Backend Service",
    version="1.0.0",
    lifespan=lifespan
)

# Configure allowed origins for local development
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register endpoints routers
app.include_router(profile_router)
app.include_router(education_router)
app.include_router(work_experience_router)
app.include_router(project_router)
app.include_router(hackathon_router)

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "service": "Career Intelligence System API",
        "version": "1.0.0"
    }
