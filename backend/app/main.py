from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Career Intelligence System API",
    description="Local-First Career Memory and Resume Tailoring Backend Service",
    version="1.0.0"
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

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "service": "Career Intelligence System API",
        "version": "1.0.0"
    }
