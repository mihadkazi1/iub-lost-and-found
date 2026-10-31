# Deployment Guide — IUB Lost & Found

This guide publishes the React frontend and FastAPI backend separately. Example service names are suggestions; use the actual URLs provided by each service.

## Architecture

- **Vercel:** React + TypeScript frontend (`frontend/` root directory).
- **Render:** FastAPI backend (`backend/` root directory).
- **Neon or another managed PostgreSQL provider:** persistent database.

GitHub stores the source code; it does not run the FastAPI service by itself. Codespaces is a development environment, not permanent application hosting.

## 1. Push the source to GitHub

From the repository root, confirm the correct remote and make sure all current changes are committed on your working branch:

```bash
git remote -v
git status
```

Follow the Issue/feature-branch/PR flow in `ASSESSMENT-CHECKLIST.md`, then push and merge the accepted PR into `main`.

## 2. Create a PostgreSQL database

1. Create a database project in Neon or another PostgreSQL provider.
2. Copy its connection string from the provider dashboard.
3. In the database URL, use the SQLAlchemy psycopg dialect prefix `postgresql+psycopg://` and keep the provider's host, database, username, password, and SSL query parameters.
4. Keep this connection string secret. Do not store it in Git or commit it to `.env` files.

Example shape only:

```text
postgresql+psycopg://USER:PASSWORD@HOST/DBNAME?sslmode=require
```

Do not use this placeholder literally.

## 3. Deploy FastAPI on Render

1. Open Render and choose **New → Web Service**.
2. Connect the GitHub repository containing this project.
3. Configure:
   - **Branch:** `main` (or your assessment branch while testing)
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables:
   - `DATABASE_URL` = the actual PostgreSQL URL from step 2.
   - `CORS_ORIGINS` = the exact Vercel origin after the frontend has been created, for example `https://your-project.vercel.app` (no trailing slash). It can be added after Step 4 and the backend redeployed.
5. Deploy. Copy the actual Render service origin, such as `https://your-api.onrender.com`.
6. Test `https://YOUR-ACTUAL-API-URL/api/health` and `https://YOUR-ACTUAL-API-URL/docs`.

The app creates the needed tables and demo seed rows at startup. Treat the seed data as fictitious. If using a free backend tier that sleeps, the first API request after idle time may take longer.

## 4. Deploy the React frontend on Vercel

1. Open Vercel and import the same GitHub repository.
2. Set the **Root Directory** to `frontend`.
3. Use the Vite defaults or verify:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. In the Vercel project's **Environment Variables**, add:
   - Name: `VITE_API_BASE_URL`
   - Value: your actual Render service origin, e.g. `https://your-api.onrender.com` (no trailing slash)
5. Deploy. Copy the public `.vercel.app` URL.

`VITE_API_BASE_URL` is embedded at build time. If you add/change it after a deployment, trigger a new deployment.

## 5. Set backend CORS and redeploy

1. Return to Render → your Web Service → **Environment**.
2. Set `CORS_ORIGINS` to the exact frontend origin from Vercel, for example `https://your-project.vercel.app`.
3. Save changes and redeploy/restart the service as requested by Render.
4. Visit the frontend again and test the site in a fresh/private browser window.

If a Vercel preview deployment has another origin, add that exact preview origin to `CORS_ORIGINS` while testing, or use the production deployment URL for the assessment demo.

## 6. End-to-end smoke test

- Visit the Vercel URL; the board loads without signing in.
- Search and filters work.
- Posting as a guest opens the sign-in form; a direct unauthenticated `POST /api/items` returns `401`.
- Sign in with dummy/test data, create a report, and attach an optional photo.
- Click **Details** and verify the single-item endpoint loads.
- Edit the report, resolve/reopen it, then delete it while signed in as the owner.
- Sign in as a different demo ID and confirm edit/delete requests for another user's report are rejected.
- Refresh the page and confirm saved reports remain present.
- Open the Render `/docs` page and demonstrate the REST routes.
- Use browser Developer Tools → **Network** to show frontend requests, status codes, and JSON responses.

## Troubleshooting

- **Frontend builds but API requests fail:** check `VITE_API_BASE_URL`, redeploy Vercel, and check Render `CORS_ORIGINS`.
- **Images do not load:** confirm the frontend uses the same `VITE_API_BASE_URL` as the API and that the returned image URL is reachable.
- **Database connection error:** verify the PostgreSQL URL starts with `postgresql+psycopg://`, the password is correct, and SSL/query parameters from the provider are preserved.
- **Render is sleeping:** wait for its first request to finish; check the Render logs if requests keep failing.
- **Never expose `DATABASE_URL` in screenshots, browser code, or Git history.**

## Deployment/security limitation

This project uses a teaching/demo sign-in that accepts a Student ID, name, and phone number without checking IUB records. Publicly deploy only with fake/demo contact information. Real student use requires IUB-approved authentication, privacy review, and appropriate retention/moderation controls.
