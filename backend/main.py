import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.jobs.scheduler import start_scheduler, shutdown_scheduler

from app.api.users import router as users_router
from app.api.auth import router as auth_router
from app.api.courses import router as courses_router
from app.api import lessons, bookmarks, user_goals, course_quiz, content, calendar, course_discovery
from app.api.quizzes import router as quizzes_router
from app.api.attempts import router as attempts_router
from app.api.progress import router as progress_router
from app.api.skills import router as skills_router
from app.api.learning_paths import router as learning_paths_router
from app.api.ai_tutor import router as ai_tutor_router
from app.api.lesson_resources import router as lesson_resources_router
from app.api.study_plans import router as study_plans_router
from app.api.personalization import router as personalization_router
from app.api.pdf_learning import router as pdf_learning_router
from app.api.pdf_ai import router as pdf_ai_router
from app.api.statistics_assistant import router as statistics_assistant_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    try:
        yield
    finally:
        shutdown_scheduler()


app = FastAPI(
    title="Statskill API",
    description="Backend for the Statskill learning platform",
    version="1.0.0",
    lifespan=lifespan,
)

cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "Welcome to Statskill API", "status": "running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


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
app.include_router(bookmarks.router)
app.include_router(user_goals.router)
app.include_router(course_quiz.router)
app.include_router(content.router)
app.include_router(calendar.router)
app.include_router(course_discovery.router)
app.include_router(study_plans_router)
app.include_router(pdf_learning_router)
app.include_router(pdf_ai_router)
app.include_router(statistics_assistant_router)
