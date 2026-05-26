# Reporta AI

Reporta AI is an AI-powered football content generation platform. It combines live football data from Dribl with local Ollama generation on a GPU server to create match reports and league summaries for editorial review.

The current demo deployment uses a React + Vite frontend, a FastAPI backend, SQLite, and Ollama running locally on the GPU server with `qwen2.5:14b`.

## Features

- Login and JWT-protected API access
- Dashboard metrics for matches, leagues, jobs, and usable generated reports
- Match browsing with date filters, status filters, search, sorting, and pagination
- Async match report generation through Ollama
- Async league summary generation through Ollama
- Jobs page for tracking processing, complete, draft, approved, published, and failed reports
- Generated report editor with save draft, approve, and delete actions
- Real report persistence in SQLite through the backend

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, React Router
- Backend: FastAPI, SQLAlchemy, Pydantic
- Database: SQLite for the current demo/deployment
- External sports data: Dribl API
- LLM runtime: Ollama on the GPU server
- Current model: `qwen2.5:14b`

## Folder Structure

```text
Reporta_AI_Git/
  backend/
    app/
      main.py
      db.py
      models.py
      schemas.py
      services/
        dribl.py
        ollama.py
        prompts.py
    requirements.txt
  frontend/
    src/
      components/
      pages/
      utils/
    package.json
    .env.example
  README.md
```

## Environment Variables

Create `backend/.env`:

```env
DRIBL_TOKEN=your_dribl_token_here
DATABASE_URL=sqlite:///./app.db
SECRET_KEY=replace_with_a_long_random_secret
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:14b
```

Create `frontend/.env` from `frontend/.env.example`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

For the current GPU server example, use:

```env
VITE_API_BASE_URL=http://172.20.20.102:8000
```

Do not commit `.env` files or real secrets.

## Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env` using the variables above, then run:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend local URL:

```text
http://127.0.0.1:8000
```

Backend API docs:

```text
http://127.0.0.1:8000/docs
```

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Update `frontend/.env` if the backend is running on another host, then run:

```bash
npm run dev -- --host 0.0.0.0
```

Frontend local URL:

```text
http://127.0.0.1:5173
```

## GPU and Ollama Notes

Ollama should be running locally on the GPU server.

Confirm Ollama is reachable:

```bash
curl http://127.0.0.1:11434/api/tags
```

Backend `.env` should point to the local Ollama server:

```env
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:14b
```

## Current GPU Server URLs

For the current GPU server deployment:

- Frontend: `http://172.20.20.102:5173`
- Backend docs: `http://172.20.20.102:8000/docs`

These URLs are deployment-specific. Change the host/IP when running on another server.

## Async Generation Workflow

1. User logs in and browses matches or leagues.
2. User clicks Generate for a match report or league summary.
3. Backend creates a `Report` row immediately with `status="processing"`.
4. Frontend navigates to the Jobs page.
5. FastAPI runs Ollama generation in the background.
6. On success, the same report is updated to `status="complete"` with generated content.
7. On failure, the report is updated to `status="failed"` with an error message.
8. User opens a complete report, edits it, saves as draft, approves it, or deletes it.

## Demo Workflow

1. Start Ollama on the GPU server and confirm `/api/tags` works.
2. Start the backend with the Dribl token, SQLite database URL, JWT secret, and Ollama settings.
3. Start the frontend with `VITE_API_BASE_URL` pointing to the backend.
4. Log in.
5. Browse Matches or Leagues.
6. Generate a match report or league summary.
7. Watch the job move from Processing to Complete on the Jobs page.
8. Open the generated report, edit it, save draft, approve, or delete.

## Git Ignore and Security Notes

- Never commit `.env` files.
- Never commit real API tokens or JWT secrets.
- Never commit `backend/app.db`.
- Never commit virtual environments such as `venv/`.
- Never commit `node_modules/` or frontend build output.

The existing `.gitignore` is configured for these files and directories.
