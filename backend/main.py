
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.users import router as users_router
from app.api.auth import router as auth_router
from app.api.courses import router as courses_router
from app.api import lessons

app = FastAPI(
    title="Statskill API",
    description="Backend for the Statskill learning platform",
    version="1.0.0",
)


# CORS CONFIGURATION
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://192.168.1.17:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "Welcome to Statskill API",
        "status": "running",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# Register API routers
app.include_router(users_router)
app.include_router(auth_router)
app.include_router(courses_router)
app.include_router(lessons.router)