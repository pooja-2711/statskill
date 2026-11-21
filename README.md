# Statskill – AI-Powered Learning Platform

**Statskill** is an AI-powered learning platform designed to make learning more accessible, structured, and personalized. It helps students discover courses, follow guided learning paths, study lessons, take assessments, and track their learning progress.

The platform combines modern web technologies with AI-powered learning assistance to create an interactive educational experience.

---

## Key Features

### 1. User Authentication and Profiles
- User registration and login
- Secure authentication
- User profile management
- Role-based learning and content management

### 2. Courses and Lessons
- Explore available courses
- Access structured learning materials
- Browse lessons and educational resources
- Organize content into learning modules

### 3. Learning Paths
- Follow structured learning journeys
- Enroll in learning paths
- Explore Government Exams Preparation
- Explore Statistics and Data Analysis
- Track learning progress across courses

### 4. Quizzes and Assessments
- Interactive multiple-choice and True/False questions
- Timed quiz attempts
- Automatic score calculation
- Pass/fail assessment
- Quiz attempt history
- Resume unfinished attempts after refreshing the page
- Backend deadline enforcement

### 5. Learning Progress
- Monitor learning activity
- Track course and learning progress
- Maintain learning goals and bookmarks
- Support structured self-paced learning

### 6. AI-Powered Learning Assistance
- AI-powered learning assistant
- Personalized learning support
- Adaptive learning capabilities
- AI-based educational assistance

### 7. EnviStats – Statistics Learning Assistant
- Statistics-focused learning assistance
- Retrieval-augmented information access
- ChromaDB vector database integration
- Sentence Transformers-based semantic search
- Scheduled educational content ingestion

### 8. Additional Learning Tools
- PDF-based learning features
- Study plans
- Learning goals
- Bookmarks
- Course discovery
- Calendar integration

---

## Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React 19, TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| API Communication | Axios |
| Animations | Framer Motion |
| Backend | Python, FastAPI |
| ORM | SQLAlchemy |
| Database Migrations | Alembic |
| Database | PostgreSQL |
| AI / Vector Search | ChromaDB |
| Embeddings | Sentence Transformers |
| Scheduling | APScheduler |
| Testing | Pytest |

---

## Project Structure

```text
statskill/
│
├── backend/
│   ├── app/
│   │   ├── api/              # API routes and endpoints
│   │   ├── core/             # Application configuration
│   │   ├── db/               # Database configuration
│   │   ├── integrations/     # External service integrations
│   │   ├── jobs/             # Scheduled background jobs
│   │   ├── models/           # Database models
│   │   ├── schemas/          # Request and response schemas
│   │   └── services/         # Business logic
│   │
│   ├── alembic/              # Database migrations
│   ├── data/                 # EnviStats data
│   ├── seed_government_statistics_quizzes.py
│   ├── main.py               # FastAPI application entry point
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Application pages
│   │   └── ...
│   ├── package.json
│   └── .env.example
│
├── requirements.txt
├── .gitignore
└── README.md
```

---

## Getting Started

Follow these instructions to run Statskill locally.

### Prerequisites

Install the following:

- Python 3.11 or newer
- Node.js 20.19+ or 22.12+
- npm
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/pooja-2711/statskill.git
cd statskill
```

### 2. Set Up the Backend

Create a Python virtual environment:

**Windows PowerShell:**

```powershell
py -m venv backend/.venv
```

Activate it:

```powershell
.\backend\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
py -m pip install -r requirements.txt
py -m pip install -r backend/requirements.txt
```

### 3. Configure Environment Variables

Create your backend environment file:

```powershell
Copy-Item backend/.env.example backend/.env
```

Configure the required environment variables in `backend/.env`.

| Variable | Purpose |
|---|---|
| DATABASE_URL | Database connection string |
| SECRET_KEY | Authentication secret |
| GEMINI_API_KEY | Gemini AI integration |
| GROQ_API_KEY | Groq AI integration |
| GROQ_MODEL | Groq model selection |
| YOUTUBE_API_KEY | YouTube integration |
| YOUTUBE_DAILY_QUOTA_LIMIT | YouTube API quota |
| ENVI_STATS_DATABASE_PATH | EnviStats vector database location |
| INGEST_ENABLED | Scheduled ingestion control |
| CORS_ORIGINS | Allowed frontend origins |

Generate a secure secret key:

```powershell
py -c "import secrets; print(secrets.token_urlsafe(32))"
```

Use the generated value for `SECRET_KEY`.

Configure your PostgreSQL database and initialize its schema using the project's database migration procedure before running database-dependent features.

### 4. Run the Backend

From the project root:

```powershell
cd backend
py -m uvicorn main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

Health check:

```text
http://127.0.0.1:8000/health
```

### 5. Set Up the Frontend

Open a second terminal and navigate to the frontend:

```powershell
cd frontend
npm ci
```

Create the frontend environment file:

```powershell
Copy-Item .env.example .env
```

Configure the API URL in `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### 6. Run the Frontend

From the frontend directory:

```powershell
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

The frontend and backend should run in separate terminals.

---

## Running Tests

### Backend Tests

From the backend directory:

```powershell
python -m pytest -q
```

### Frontend Production Build

From the frontend directory:

```powershell
npm run build
```

---

## Learning Content

Statskill includes structured learning content in areas such as:

### Government Exams Preparation
- UPSC Civil Services Preparation
- SSC CGL and CHSL Preparation
- Banking Exams Preparation
- Railway Exams Preparation
- State PSC Preparation
- Defence Exams Preparation
- General Studies and General Knowledge
- Current Affairs for Competitive Exams

### Statistics and Data Analysis
- Fundamentals of Statistics
- Descriptive Statistics
- Probability and Probability Distributions
- Sampling Techniques
- Hypothesis Testing
- Correlation and Regression
- Statistical Inference
- Data Interpretation and Quantitative Aptitude

The platform also supports additional career-oriented learning paths and courses.

---

## Optional Integrations

Some features require additional configuration:

- **Gemini and Groq:** Configure the respective API keys.
- **YouTube:** Configure a YouTube API key.
- **Google Calendar:** Configure the required OAuth credentials and redirect URI.
- **Ollama:** Run the required local service for Ollama-based AI features.

Features requiring external services will only work when those services are configured correctly.

---

## Security Notes

- Never commit `.env` files or API keys.
- Never publish database credentials or secret keys.
- Use your own environment configuration.
- Keep uploaded documents and private data secure.
- Use secure authentication settings in production.

---

## Future Improvements

Potential areas for continued development include:

- More personalized learning recommendations
- Expanded AI-powered tutoring
- Advanced learning analytics
- Additional interactive assessments
- Improved learning progress visualizations
- More educational content and learning paths

---

## Contributing

Contributions, suggestions, and improvements are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test your changes.
5. Submit a pull request.

---

## Repository

GitHub: https://github.com/pooja-2711/statskill

---

## License

No license has currently been specified. Add an appropriate open-source license before distributing the project under specific reuse permissions.

---

**Built to make learning smarter, structured, and more accessible.**
