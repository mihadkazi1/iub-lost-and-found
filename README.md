# IUB Lost & Found — CSE309 MVP

A responsive campus lost-and-found board for the CSE309 mid-project MVP assessment. Students can browse and search reports, sign in with the classroom demo form, create reports with optional item photos, open a single report, edit their own reports, resolve/reopen them, and delete their own reports.

> **Coursework demonstration only.** This is an independent student project, not an official IUB service. Student ID + name sign-in is not connected to IUB identity records. Use fake/demo details only until an approved identity provider is integrated.

## Technology stack

- Frontend: React 18 + TypeScript + Vite
- Backend: FastAPI + Python + Pydantic
- Data access: SQLAlchemy
- Local database: SQLite (`backend/data/lost_found.db`)
- Hosted database option: PostgreSQL through `DATABASE_URL`
- Hosting plan: Vercel frontend + Render FastAPI + managed PostgreSQL (for example, Neon)

## MVP features (CRUD)

| Operation | UI | REST API | Access |
|---|---|---|---|
| Create | New report form | `POST /api/items` | Signed-in student |
| Read list | Searchable, filterable board | `GET /api/items` | Public; contact details hidden |
| Read single | Details button on each card | `GET /api/items/{id}` | Public; private contact instructions hidden except for owner |
| Update | Edit report, resolve/reopen | `PUT /api/items/{id}`, `PATCH /api/items/{id}/status` | Owner only |
| Delete | Delete action on owned card | `DELETE /api/items/{id}` | Owner only |

Additional endpoints: `GET /api/health`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`, `GET /api/stats`, `GET /api/items/{id}/contact`, and `GET /api/items/{id}/image`.

## Run in GitHub Codespaces

Run the backend in terminal 1:

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Run the frontend in terminal 2:

```bash
cd frontend
npm install
npm run dev
```

Open forwarded port `5173` for the website. API documentation is available at `/docs` on backend port `8000`. During local development, Vite proxies `/api` requests to FastAPI.

## Demo walkthrough

1. Browse reports and filter by lost/found/category/status as a guest.
2. Click **Post an item**. The app asks the visitor to sign in before showing the report form.
3. Sign in with a Student ID, name, and phone number. Use a test phone number only.
4. Create a lost/found report; optionally upload a JPG/PNG/WebP photo (maximum 2 MB).
5. Click **Details** to show a single report loaded by ID.
6. Sign in as the owner and use **Edit**, **Resolve/Reopen**, and **Delete** to demonstrate the remaining CRUD operations.
7. Open `http://localhost:8000/docs` (or the deployed API `/docs`) to show the REST endpoints. Use browser Developer Tools → Network to explain a UI request and response.

The demo sign-in mechanism is for coursework and can be impersonated. Do not use real private student contact information.

## Environment variables

### Backend

- `DATABASE_URL`: defaults to `sqlite:///./data/lost_found.db` when the backend starts from `backend/`. For PostgreSQL, use a SQLAlchemy URL like `postgresql+psycopg://USER:PASSWORD@HOST/DBNAME?sslmode=require`.
- `CORS_ORIGINS`: comma-separated frontend origins. Local defaults permit `http://localhost:5173` and `http://127.0.0.1:5173`; set the production Vercel origin in Render.

### Frontend

- `VITE_API_BASE_URL`: empty by default for local Vite proxying. Set this to the deployed Render API origin (no trailing slash), such as `https://your-api.onrender.com`, in Vercel project environment variables.

## Deploy for the assessment

Read [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the guided Neon + Render + Vercel setup. The deployment must be tested end-to-end; GitHub repository visibility does not itself host the FastAPI backend.

## Tests and build

Backend tests, from the project root:

```bash
cd backend
python -m pip install -r requirements.txt
python -m pytest -q
```

Frontend production build:

```bash
cd frontend
npm install
npm run build
```

## GitHub assessment workflow

Read [`docs/ASSESSMENT-CHECKLIST.md`](docs/ASSESSMENT-CHECKLIST.md). Required workflow: create an Issue, create an issue-named feature branch, commit and push work to that branch, open a PR that contains `Closes #ISSUE_NUMBER`, review it, and merge it into `main` before the assessment. Do not commit this assessment work directly to `main` if the rubric expects a feature branch and PR.

## Documentation

- [PRD](docs/PRD.md)
- [SRS](docs/SRS.md)
- [TDD](docs/TDD.md)
- [Deployment guide](docs/DEPLOYMENT.md)
- [Assessment checklist](docs/ASSESSMENT-CHECKLIST.md)
