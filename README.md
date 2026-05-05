# Reporta AI

AI-powered football content generation system for managing structured football data, generation jobs, and reports.


## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```


## Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn python-dotenv curl_cffi sqlalchemy psycopg2-binary passlib[bcrypt] python-jose
uvicorn app.main:app --reload
```

Backend will run at:

http://127.0.0.1:8000

Swagger docs:

http://127.0.0.1:8000/docs


## Environment Variables

Create a `.env` file inside `backend/`:

```env
DRIBL_TOKEN=your_dribl_token_here
DATABASE_URL=sqlite:///./app.db
SECRET_KEY=your_secret_key
```


## Features

- Fetch real football data from Dribl API
- Generate match reports
- Save reports to database (SQLite)
- Edit, approve, and publish workflow
- JWT-based authentication
- Protected API endpoints


## Project Structure

```
backend/
  app/
    main.py
    db.py
    models.py
    services/
      dribl.py
frontend/
```


## Notes

- Backend uses SQLite for simplicity (no setup required)
- Frontend and backend run independently
- Authentication required for report endpoints
