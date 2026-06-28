from fastapi import FastAPI

app = FastAPI(
    title="Career Intelligence System API",
    description="Local-First Career Memory and Resume Tailoring Backend Service",
    version="1.0.0"
)

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "service": "Career Intelligence System API",
        "version": "1.0.0"
    }
