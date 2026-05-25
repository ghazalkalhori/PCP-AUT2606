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


## Ollama Connection Setup

Reporta AI generates football reports using a self-hosted LLM (Ollama) running on a remote GPU server.
Access requires VPN + SSH port forwarding.

### 1. Connect to VPN first

Make sure you are connected to the team VPN before opening the SSH tunnel.

### 2. Open the SSH tunnel

```bash
ssh -L 11434:127.0.0.1:11434 team-AUT2606@172.20.20.102
```

Leave this terminal open while using the app.

If port 11434 is already in use on your machine, use an alternative port:

```bash
ssh -L 11435:127.0.0.1:11434 team-AUT2606@172.20.20.102
```

Then update `backend/.env`:

```env
OLLAMA_URL=http://127.0.0.1:11435
```

Restart the backend after changing `.env`.

### 3. Verify Ollama is reachable locally

```bash
curl http://127.0.0.1:11434/api/tags
```

You should see a JSON response listing available models.

### 4. Start the backend

```bash
cd backend
source venv/Scripts/activate   # Windows: source venv/Scripts/activate
python -m uvicorn app.main:app --reload
```

### 5. Start the frontend

```bash
cd frontend
npm run dev
```

### 6. Test the connection in the UI

1. Log in at http://localhost:5173/login
2. Go to **Generate Report** in the sidebar
3. Click **Test Ollama Connection**
4. If successful, available model names will appear
5. Fill in the form and click **Generate Report** to test end-to-end

### Troubleshooting

| Symptom | Check |
|---------|-------|
| "Cannot connect to Ollama" | VPN connected? SSH tunnel still open? |
| No models listed | Is Ollama running on the remote server? |
| 401 on status check | Log in first — the endpoint requires a valid JWT |
| Report times out | Model may be loading; wait up to 5 minutes or retry |
| Old error after `.env` change | Restart the backend after any `.env` change |

### Security reminders

- Do **not** commit passwords, tokens, or `.env` files
- Only `.env.example` (with placeholder values) should be committed
- Do **not** call Ollama directly from the frontend — only the backend talks to Ollama
