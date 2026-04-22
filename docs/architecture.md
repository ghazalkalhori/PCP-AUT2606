# Architecture Notes

Reporta AI is split into a React admin dashboard and a Django REST backend.

## Frontend

The frontend uses feature and layer folders:

- `components/` for reusable UI building blocks
- `layouts/` for page shells
- `pages/` for route-level screens
- `services/` for API access
- `context/` for shared app state such as auth
- `routes/` for route definitions

## Backend

The backend uses Django apps by domain:

- `users`
- `leagues`
- `matches`
- `reports`
- `generation_jobs`
- `common`

The `llm/` module is kept separate from Django apps so prompt building, provider calls, parsing, and validation can evolve independently.
