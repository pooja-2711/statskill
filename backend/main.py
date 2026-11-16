
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
from app.api.ai_tutor import router as ai_tutor_router
from app.api.lesson_resources import router as lesson_resources_router
from app.api.personalization import router as personalization_router
from app.api.pdf_learning import router as pdf_learning_router
from app.api.pdf_ai import router as pdf_ai_router
from app.api.statistics_assistant import (
    router as statistics_assistant_router,
)


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


# ROOT ENDPOINT
@app.get("/")
def home():
    return {
        "message": "Welcome to Statskill API",
        "status": "running",
    }


# HEALTH CHECK
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
app.include_router(ai_tutor_router)
app.include_router(lesson_resources_router)
app.include_router(personalization_router)

# PDF LEARNING ASSISTANT
app.include_router(pdf_learning_router)
app.include_router(pdf_ai_router)

# ENVISTATS STATISTICS ASSISTANT
app.include_router(statistics_assistant_router)
