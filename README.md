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


# Test Cases

## Functional Test Cases

| Test Case ID | Test Case Name                            | Objective                                                                                                 | Precondition                                                                                      | Steps                                                                                                                            | Expected Result                                                                                                                                                                              | Status    |
| ------------ | ----------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| TC01         | User/Admin Login with Valid Credentials   | To verify that a user can login successfully.                                                             | User account exists and is active.                                                                | 1. Open the app login page<br>2. Enter valid username and password<br>3. Click login button                                      | Login credentials are validated.<br>User is redirected to the dashboard.                                                                                                                     | Pass      |
| TC02         | User/Admin Login with Invalid Credentials | To verify that the system blocks invalid login.                                                           | Login page is open.                                                                               | 1. Open the app login page<br>2. Enter incorrect username and password<br>3. Click login button                                  | Login credentials are checked and the system does not log the user in.<br>Error message is displayed and the user remains on the same page.                                                  | Pass      |
| TC03         | View Dashboard                            | To verify that the main dashboard loads successfully after login.                                         | User is authenticated with an active session.                                                     | 1. Log in as user/admin<br>2. Wait for dashboard to load                                                                         | Dashboard displays real-time statistics and content status.                                                                                                                                  | Pass      |
| TC04         | View Matches                              | To verify that the system displays match listings from Dribl for report generation selection.             | User is authenticated and Dribl API connection is operational.                                    | 1. From dashboard, select Matches<br>2. Wait for the system to load match data                                                   | Match lists are retrieved and displayed in a table.<br>Matches can be filtered by competition, date, or content status.                                                                      | Pass      |
| TC05         | Filter Match Data                         | To verify that the system filtering works correctly.                                                      | Match list should be displayed.                                                                   | 1. Open match list<br>2. Apply a league filter<br>3. Apply a date filter                                                         | Match lists are displayed according to the filter condition.<br>Only matching data is displayed.                                                                                             | Pass      |
| TC06         | Fetch Match Data                          | To verify that the system retrieves detailed match data from Dribl API.                                   | Match list is available and Dribl API credentials are configured.                                 | 1. Select a match from the list<br>2. Click the Generate Report button                                                           | System constructs API request.<br>Match data such as winning team, goals, and score are retrieved from Dribl API.<br>Raw JSON is stored.<br>A popup content configuration form is displayed. | Pass      |
| TC07         | Configure Content Traits                  | To verify that user configures stylistic parameters for content generation.                               | User has selected a match or competition for content generation and the form should be displayed. | 1. Select content type<br>2. Set tone, excitement, and other traits influencing output style<br>3. Save or confirm configuration | Content traits are accepted and stored for use in the generation prompt.<br>User can proceed to content generation.                                                                          | Pass      |
| TC08         | Generate Report Successfully              | To verify that the system generates draft content using the self-hosted LLM.                              | Match data is fetched, traits are configured, and LLM service is available.                       | 1. Click the Generate Report button                                                                                              | System constructs structured prompt successfully.<br>Draft report is created, stored in the database, and displayed for editorial review.                                                    | Pass      |
| TC09         | Review, Edit and Save Report              | To verify that the user reviews generated content, makes editorial modifications, and saves successfully. | Generated report exists in Draft or Review status.                                                | 1. Open generated report<br>2. Load WYSIWYG editor<br>3. Click Save button                                                       | Report content is viewed successfully.<br>Editing tools are enabled.<br>Changes are saved to the database.<br>A new version of report is created.                                            | Pass      |
| TC10         | Approve for Publishing                    | To verify that the user can approve a reviewed report for publication.                                    | Report is in Review status and user has approval permissions.                                     | 1. Open the report in review state<br>2. Click the Approve button                                                                | Report status is Approved.<br>Content is eligible for publication.                                                                                                                           | Pass      |
| TC11         | Publish Approved Report                   | To verify that the user publishes approved content through the API.                                       | Report is in approved state.                                                                      | 1. Open the approved report section<br>2. Click the Publish button                                                               | Report is publicly accessible via API.<br>Publication is recorded in the database.                                                                                                           | Pass      |
| TC12         | View Audit Trail                          | To verify that audit records can be displayed correctly.                                                  | User is authenticated with audit viewing permissions.                                             | 1. Open the Audit Trail page<br>2. View history and apply filter                                                                 | Software displays all audit entries.<br>User can review historical actions and restore versions.                                                                                             | Pass/Fail |

---

## Full System Integrated Test

| Test Case ID | Test Case Name                                       | Objective                                                             | Precondition                                                                                | Steps                                                                                                                                                                                                                                                                                                      | Expected Result                                                                                                                            | Status |
| ------------ | ---------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| TC13         | Complete Content Generation and Publication Workflow | To verify full application workflow from login to report publication. | User/Admin account exists in the system, Dribl API is available, and AI service is running. | 1. Log in with valid user ID and password<br>2. Access dashboard<br>3. View match lists<br>4. Filter match list<br>5. Select a match<br>6. Configure content traits<br>7. Generate report<br>8. Review or modify report<br>9. Approve report<br>10. Publish report<br>11. Open audit trail and see history | Every step completes successfully without error.<br>Published report is accessible.<br>User views history of actions and content versions. | Pass   |

---

## Non-Functional Test Cases

| Test Case ID | Test Case Name          | Objective                                                                               | Precondition                                                     | Steps                                                                                                                                         | Expected Result                                                                                         | Actual Result                                                               | Status |
| ------------ | ----------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------ |
| NFTC-01      | Response Time           | Verify acceptable response time for the report generation process.                      | Application, database, Dribl API, and LLM service are available. | 1. Select a match<br>2. Configure traits<br>3. Generate report<br>4. Measure system response time                                             | The report generation process completes within an acceptable time without timeout or system freeze.     | Report generation completed within acceptable response time.                | Pass   |
| NFTC-02      | Authentication Security | To verify that unauthenticated users are unable to access protected pages.              | User is not logged in.                                           | 1. Open a protected page URL directly<br>2. Try to access dashboard, matches, reports, or audit trail                                         | Unauthorized user is redirected to the login page or blocked with an appropriate access message.        | Protected pages were blocked for unauthenticated users.                     | Pass   |
| NFTC-03      | Error Handling          | Verify that errors or invalid user input do not crash the system.                       | Application is running.                                          | 1. Enter invalid input in available forms<br>2. Simulate unavailable API or invalid response<br>3. Observe the system behaviour               | System displays an error message and continues running without crashing.                                | Errors were handled properly and the application remained stable.           | Pass   |
| NFTC-04      | Maintainability         | Verify that system logs, records, and edit history are properly stored in the database. | Database and audit logging are enabled.                          | 1. Generate a report<br>2. Edit and save the report<br>3. Approve and publish the report<br>4. Check logs, report versions, and audit history | System logs, records, report versions, and edit history are stored correctly and can be reviewed later. | Logs, records, report versions, and audit history were stored successfully. | Pass   |

---

## Test Summary

| Category       | Total Test Cases | Passed | Failed |
| -------------- | ---------------: | -----: | -----: |
| Functional     |               12 |     12 |      0 |
| Integrated     |                1 |      1 |      0 |
| Non-Functional |                4 |      4 |      0 |
| **Total**      |           **17** | **17** |  **0** |

