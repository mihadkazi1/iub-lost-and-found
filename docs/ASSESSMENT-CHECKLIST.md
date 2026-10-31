# CSE309 Mid-Project MVP Assessment Checklist

**Assessment deadline shown in the brief:** 4 November 2026. Confirm any late changes or instructor announcements in class.

The assessment is 30 marks: Frontend CRUD (10), Backend CRUD REST APIs (10), and GitHub Issue/PR/feature-branch workflow (10). The lecturer expects a Vercel deployment demo; the brief warns that failure to demonstrate the feature may deduct 10 marks.

## 1. Feature scope to demonstrate

Use **Lost & Found Reports** as the single main feature:

| CRUD action | Frontend action | API endpoint | Expected result |
|---|---|---|---|
| Create | Post an item after signing in | `POST /api/items` | 201; report appears in list |
| Read list | Board, search, filters | `GET /api/items` | 200; reports list returned |
| Read single | Click **Details** | `GET /api/items/{id}` | 200; one report returned; unknown ID is 404 |
| Update | Owner clicks **Edit** and saves; resolve/reopen | `PUT /api/items/{id}`, `PATCH /api/items/{id}/status` | 200; persisted fields/status change |
| Delete | Owner clicks delete | `DELETE /api/items/{id}` | 204; report no longer appears |

Ownership behavior: unauthenticated create/update/delete requests return 401; a signed-in non-owner's edit/delete attempt returns 403. Contact instructions and phone/WhatsApp details remain behind the signed-in contact endpoint.

## 2. GitHub workflow (10-mark component)

Use a real Issue number for the branch/PR. Example names below use Issue `12`; replace `12` with your actual number.

1. Open the GitHub repository → **Issues → New issue**.
2. Title: `Implement complete Lost & Found report CRUD for MVP`.
3. Include acceptance criteria: Create, Read List, Read Single, Update, Delete; ownership checks; tests; deployment verification.
4. In Codespaces, create a feature branch from the latest `main` before committing the implementation:

   ```bash
   git switch main
   git pull origin main
   git switch -c feature/issue-12-item-crud
   git status
   ```

   If you already have uncommitted changes, do **not** switch to a different branch until you understand whether those changes should be carried across; create the feature branch first to preserve the work.

5. Stage, commit, and push to the feature branch:

   ```bash
   git add .
   git commit -m "Implement full CRUD for lost and found reports"
   git push -u origin feature/issue-12-item-crud
   ```

6. On GitHub, open a Pull Request from the feature branch to `main`. Put `Closes #12` in the PR description.
7. Explain what changed and include test evidence in the PR description. Review the diff and ensure it contains the three docs and the code.
8. Merge the PR into `main` before assessment. Verify `main` contains the latest version.
9. Redeploy Vercel from `main` and smoke-test the live site.

## 3. Live demonstration checklist

- [ ] Open the Vercel deployment URL (not just the Codespaces forwarded URL).
- [ ] As a guest, browse/search; show that the posting flow asks for sign-in first.
- [ ] Sign in with fictitious demonstration details and create an item, with or without a photo.
- [ ] Click Details and show a single report record.
- [ ] Edit the title or location and save; show the change persists after reload.
- [ ] Mark resolved and reopen the report, showing status changes.
- [ ] Delete the test report and confirm it disappears.
- [ ] Open Browser Developer Tools → Network. Trigger an action and explain request URL, method, status code, request body, and JSON response.
- [ ] Open the deployed API `/docs`. Explain the CRUD endpoints and database model.
- [ ] If requested, send one Create/Read/Update/Delete example from Postman.

## 4. Suggested test commands

Backend (from the project root):

```bash
cd backend
python -m pytest -q
```

Frontend build:

```bash
cd frontend
npm install
npm run build
```

## 5. Viva talking points

- React functional components hold UI state and call helper functions in `frontend/src/api.ts`.
- `frontend/src/api.ts` uses `fetch` to send HTTP requests to FastAPI.
- FastAPI validates request bodies with Pydantic schemas in `backend/app/schemas.py`.
- SQLAlchemy models in `backend/app/models.py` map `Student`, `AuthSession`, and `Item` tables.
- `backend/app/main.py` reads/writes through a request-scoped database session, then returns typed JSON responses.
- A bearer token identifies a demo session. `get_current_user` protects mutations, and routes compare `owner_id` with the current student's database ID.
- Local runs use SQLite. Hosted deployment should use the managed PostgreSQL connection in `DATABASE_URL`.
- The student-ID/name form is not real identity verification and must not be presented as official IUB authentication.
