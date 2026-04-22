# Reporta AI

AI-powered football content generation system for managing structured football data, generation jobs, and reports.

This repository is a monorepo-style starter structure. It is intentionally minimal and ready for you to extend with real business logic.

## Project Structure

- `frontend/` - React admin dashboard
- `backend/` - Django REST API and LLM integration module
- `docs/` - Project notes and architecture documentation

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env` from `frontend/.env.example` when environment-specific values are needed.

## Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Create `backend/.env` from `backend/.env.example` before running the API.

## Notes

This scaffold includes placeholder models, serializers, views, routes, services, and reusable UI components. It does not include full feature logic or production deployment configuration.
