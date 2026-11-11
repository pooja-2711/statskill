from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.users import router as users_router
from app.api.auth import router as auth_router
from app.api.courses import router as courses_router
from app.api import lessons
from app.api.quizzes import router as quizzes_router
from app.api.attempts import router as attempts_router
from app.api.progress import router as progress_router
from app.api.skills import router as skills_router
from app.api.learning_paths import router as learning_paths_router
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
        "http://192.168.1.17:5173",
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


# REGISTER API ROUTERS
app.include_router(users_router)
app.include_router(auth_router)
app.include_router(courses_router)
app.include_router(lessons.router)
app.include_router(quizzes_router)
app.include_router(attempts_router)
app.include_router(progress_router)
app.include_router(skills_router)
app.include_router(learning_paths_router)