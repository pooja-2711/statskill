# Statskill – AI-Powered Learning Platform

Statskill is an AI-powered learning platform designed to help students learn, practise, track progress, and improve their skills through personalized learning tools.

This repository contains the integrated Statskill frontend and backend, including the EnviStats statistics learning assistant.

## Features

- User registration, authentication, and profile management
- Course and lesson management
- Quizzes, assessments, and quiz attempts
- Learning progress and skill tracking
- Personalized and adaptive learning
- AI-powered learning assistant
- PDF-based learning features
- Study plans and learning paths
- Bookmarks and learning goals
- Course discovery and learning resources
- Calendar integration
- EnviStats statistics assistant powered by a Chroma vector database
- Scheduled content ingestion

## Technology Stack

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- Framer Motion

### Backend
- Python
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- ChromaDB
- Sentence Transformers
- APScheduler

## Project Structure

```text
statskill/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── integrations/
│   │   ├── jobs/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   ├── alembic/
│   ├── data/
│   │   └── envi_stats_chroma_db/
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.example
├── requirements.txt
└── README.md
```

## Prerequisites

Install the following before running the project:

- Python 3.11 or newer
- Node.js 20.19+ or 22.12+
- npm
- PostgreSQL
- Git

Some AI features may also require their respective external services or API keys.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/pooja-2711/statskill.git
cd statskill
```

### 2. Backend setup

Create and activate a Python virtual environment from the project root.

Windows PowerShell:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install the backend dependencies:

```powershell
py -m pip install -r requirements.txt
py -m pip install -r backend/requirements.txt
```

### 3. Configure backend environment variables

Create your local backend environment file:

```powershell
Copy-Item backend/.env.example backend/.env
```

Open `backend/.env` and configure the required values.

Important settings:

| Variable | Purpose |
|---|---|
| DATABASE_URL | PostgreSQL connection string |
| SECRET_KEY | Secret used for authentication |
| GEMINI_API_KEY | Gemini API access |
| GROQ_API_KEY | Groq API access |
| GROQ_MODEL | Groq model selection |
| YOUTUBE_API_KEY | YouTube API access |
| YOUTUBE_DAILY_QUOTA_LIMIT | YouTube daily quota |
| ENVI_STATS_DATABASE_PATH | EnviStats Chroma database location |
| INGEST_ENABLED | Enable or disable scheduled ingestion |
| CORS_ORIGINS | Allowed frontend origins |

Generate a secret key using:

```powershell
py -c "import secrets; print(secrets.token_urlsafe(32))"
```

Set the generated value as `SECRET_KEY` in `backend/.env`.

Configure your own PostgreSQL database and use its connection URL for `DATABASE_URL`.

**Important:** The database schema must be initialized using the appropriate project database setup or migration procedure before using database-backed features. Check the existing database and Alembic migration history before applying migrations to an existing database.

### 4. EnviStats database

The repository includes the EnviStats Chroma database at:

```text
backend/data/envi_stats_chroma_db/
```

The default configuration is:

```env
ENVI_STATS_DATABASE_PATH=data/envi_stats_chroma_db
```

This path is relative to the backend directory.

Keep the database folder intact when cloning or transferring the project.

### 5. Start the backend

From the project root, activate the virtual environment and run:

```powershell
cd backend
py -m uvicorn main:app --reload
```

Backend URL:

http://127.0.0.1:8000

API documentation:

http://127.0.0.1:8000/docs

Health check:

http://127.0.0.1:8000/health

### 6. Frontend setup

Open another terminal:

```powershell
cd frontend
npm ci
```

Create the frontend environment file:

```powershell
Copy-Item .env.example .env
```

The default frontend API configuration is:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### 7. Start the frontend

From the frontend directory:

```powershell
npm run dev
```

Frontend URL:

http://localhost:5173

### 8. Build the frontend

To verify and build the production frontend:

```powershell
cd frontend
npm run build
```

## Optional Integrations

Some features require additional configuration:

- Gemini and Groq: provide their respective API keys.
- YouTube integration: provide a YouTube API key.
- Google Calendar: configure the Google Calendar client ID, client secret, and redirect URI.
- AI Tutor: configure and run the required local Ollama service if using the Ollama-based integration.

## Environment and Security

- Never commit `backend/.env` or `frontend/.env`.
- Never publish API keys, passwords, database credentials, or secret keys.
- Each developer should create their own local environment files from the example files.
- Keep local uploads, generated databases, and other private data secure.

## Development Notes

- Run the backend and frontend in separate terminals.
- PostgreSQL must be running and configured for database-backed features.
- The EnviStats Chroma database is included in this repository.
- Other generated local databases, uploads, and runtime files may need to be created separately.
- Scheduled ingestion can be controlled through `INGEST_ENABLED` and the related environment settings.

## Repository

GitHub: https://github.com/pooja-2711/statskill

## License

Add the project's applicable license information here.
