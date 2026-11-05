

from fastapi import FastAPI

from app.api.users import router as users_router
from app.api.auth import router as auth_router

app = FastAPI(
    title="Statskill API",
    description="Backend for the Statskill learning platform",
    version="1.0.0",
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


app.include_router(users_router)
app.include_router(auth_router)
