# HireScan

An AI-assisted recruiting app for parsing, scoring, and ranking resumes against Job Descriptions (JDs).

## Tech Stack

* **Backend:** Django (latest LTS) + Django REST Framework (DRF)
* **DB:** SQLite (for MVP)
* **Frontend:** React + Vite, TypeScript, TailwindCSS (with **Untitled UI** kit)
* **State/Data:** React Query (+ Zustand for UI state)
* **Auth:** JWT (djangorestframework-simplejwt) + CSRF-aware CORS config
* **AI:** OpenRouter APIs (LLM calls for `parse_resume` & `rank_candidates`)

## Setup Instructions

### Prerequisites

- Python 3.10+ 
- Node.js 18+ and npm/yarn
- OpenRouter API key

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Copy environment variables:
   ```bash
   cp ../.env.example .env
   # Edit .env and add your OPENROUTER_API_KEY
   ```

5. Run migrations:
   ```bash
   python manage.py migrate
   ```

6. Create a superuser (optional):
   ```bash
   python manage.py createsuperuser
   ```

7. Start the development server:
   ```bash
   python manage.py runserver
   ```

The backend will run on `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will run on `http://localhost:5173`

## Project Structure

```
hire-scan/
  backend/
    manage.py
    hirescan/           # Django project settings
    core/               # common utils, OpenRouter client
    jobs/               # JD models & APIs
    candidates/         # candidate models & APIs
    processing/         # batch upload, parsing, scoring, ranking
  frontend/
    index.html
    src/
      app/              # routes
      api/              # typed API clients (React Query)
      components/
      features/         # dashboard, jobs, upload, review, candidate
      styles/
      theme/            # Untitled UI + brand tokens
  ai/
    prompts/            # LLM prompt templates (md/json)
  .env.example
  README.md
```

## Running the Application

1. Start the backend server (in one terminal):
   ```bash
   cd backend
   python manage.py runserver
   ```

2. Start the frontend server (in another terminal):
   ```bash
   cd frontend
   npm run dev
   ```

3. Open your browser to `http://localhost:5173`

## Features

* JD CRUD + advanced filters (auto-reject rules)
* Batch upload of resumes (PDF/DOC/DOCX), up to 100 files at once
* AI parsing → structured candidate profile + skills/exp/links
* Scoring per JD + global ranking via OpenRouter
* Review dashboard with KPIs, bottlenecks, and trends
* Candidate detail: timeline, notes, links, ratings

## Notes

- SQLite database file: `backend/db.sqlite3` (auto-created)
- Media files stored in `backend/media/`
- All secrets in `.env` files (not committed to git)

