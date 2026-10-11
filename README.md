# IUB Lost & Found

A polished, responsive CSE309 demo project for an IUB campus lost-and-found board. Students can browse reports, search and filter by keyword/category/type/status, publish lost or found items, view contact instructions after signing in, and manage their own reports.

> **Coursework demonstration only:** This is an independent student project, not an official IUB service. Demo sign-in accepts a Student ID and full name but does not verify identity or enrollment. Do not use real student identity or sensitive personal data with the demo.

## Project stack

- **Frontend:** React + TypeScript + Vite + Lucide React
- **Backend:** FastAPI + Python + Pydantic
- **Database:** SQLite using SQLAlchemy, stored in the workspace at `backend/data/lost_found.db`
- **Dev environment:** Local machine or GitHub Codespaces

## Demo features

- Responsive campus-themed interface with the IUB logo referenced from the official IUB website and a local fallback.
- Seeded example reports for a realistic board on first run.
- Student-ID/name demo session with a random bearer token and server-side session record.
- Students must sign in before the report form can be opened or a report can be submitted; guests can browse/search but cannot post. After sign-in, the app continues directly to the report form they requested. The FastAPI endpoint independently rejects unauthenticated create requests with `401 Unauthorized`.
- Create Lost and Found reports with title, description, category, location, date, optional JPG/PNG/WebP photo (up to 2 MB), and report-specific contact instructions.
- Search, category, Lost / Found, and Open / Resolved filters.
- Contact details are excluded from public list responses and require a signed-in session.
- Report owners can mark their own items resolved or delete their own reports.
- API documentation, loading/empty/error states, community safety guidance, and aggregate counts.
- PRD, SRS, and TDD provided in `docs/`.

## Run in GitHub Codespaces

1. Upload/push this project to a GitHub repository, then choose **Code → Codespaces → Create codespace on main**. The included `.devcontainer/devcontainer.json` installs the dependencies when the Codespace is created.
2. Open a terminal and start the backend:

   ```bash
   cd backend
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

3. Open a second terminal and start the frontend:

   ```bash
   cd frontend
   npm run dev
   ```

4. Open the forwarded port **5173** in the Ports panel. FastAPI runs on port **8000** and its API docs are available at `/docs` on the forwarded backend port.

If the devcontainer dependency installation did not run, install manually:

```bash
python -m pip install -r backend/requirements.txt
npm --prefix frontend install
```

## Run locally

Requirements: Python 3.10+ and Node.js 20+.

### Terminal 1 — backend

```bash
cd backend
python -m venv .venv

# macOS/Linux
source .venv/bin/activate

# Windows PowerShell (use this instead of the source command)
# .venv\Scripts\Activate.ps1

python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Terminal 2 — frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The Vite development server proxies `/api` requests to FastAPI on port 8000.

## Try the demo

You can browse and search the seeded report board without signing in. Creating a report and viewing contact instructions require a signed-in session. If you click a posting button as a guest, the sign-in dialog opens first and the report form opens after successful sign-in. Enter a demo Student ID, full name, and phone number, for example:

- Student ID: `DEMO-2026`
- Full name: `Demo Student`
- Phone number: enter a test number you control (the form requires 7–15 digits)
- WhatsApp number: enter a separate number or leave blank to use the phone number

These are illustrative values only. The demo endpoint creates a local session; it does not contact IUB or verify that the person is a student. In this MVP, different names entered with the same Student ID will update that demo profile, so avoid using real personal information.

## Database notes

The SQLite database is automatically created on first backend startup. Six fictitious reports and five fictitious student profiles are seeded if no reports exist. Phone/WhatsApp contact details are shown only through the signed-in contact endpoint. Item photos are stored as data URLs in SQLite and served by a dedicated image endpoint to keep board responses smaller. The database file is ignored by Git to keep mutable demo data out of source control.

`DATABASE_URL` can be set to another SQLAlchemy database URL. `CORS_ORIGINS` is a comma-separated list of allowed origins. Copy `backend/.env.example` as a reference; the MVP does not require a `.env` file for its defaults.

GitHub Codespaces is a development environment, not a managed database. SQLite in the workspace is convenient for a class demo, but this is not a production persistence or backup strategy. For Beta, use managed PostgreSQL, migrations, managed backups, deployment secrets, HTTPS, rate limiting, and IUB-approved SSO.

## Tests and build

Backend smoke tests (run from `backend/`):

```bash
python -m pip install -r requirements.txt
python -m pytest
```

Frontend production build (run from `frontend/`):

```bash
npm install
npm run build
```

## Documentation

- [PRD — Product Requirements Document](docs/PRD.md)
- [SRS — Software Requirements Specification](docs/SRS.md)
- [TDD — Technical Design Document](docs/TDD.md)

Each document separates MVP requirements for the midterm demo from future Beta requirements for the final demo.

## Important production checklist

Before using this for real IUB students, replace demo identity entry with an approved IUB identity provider, move to a managed database, restrict secrets and CORS, review retention and privacy, add moderation and abuse reporting, and obtain any required university approval. The logo is referenced from IUB's official public website; this code is not affiliated with or endorsed by IUB.
