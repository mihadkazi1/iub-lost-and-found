# Software Requirements Specification (SRS)

**System:** IUB Lost & Found  
**Version:** 1.0  
**Course:** CSE309

## 1. Introduction

### 1.1 Purpose

This document defines the expected behavior, data, interfaces, and quality requirements for the IUB Lost & Found classroom demonstration application.

### 1.2 Scope

The system provides a searchable campus lost-and-found board. Its MVP consists of a React + TypeScript frontend, a FastAPI + Python backend, REST endpoints, and an SQLite database stored in the development workspace. Later Beta features are marked explicitly and are not represented as implemented.

### 1.3 Definitions

- **Report:** A record describing an item marked `lost` or `found`.
- **Open:** A report that still needs a match or handover.
- **Resolved:** A report owner has marked the report as returned or otherwise complete.
- **Demo session:** A server-generated bearer token created after entering a Student ID, name, and phone number; it is not evidence of IUB identity.
- **Owner:** The student record associated with creating a report.

## 2. Overall description

### 2.1 Product perspective

The frontend communicates with a single FastAPI service through JSON REST APIs. FastAPI reads and writes the SQLite database through SQLAlchemy. During local development, Vite proxies `/api` calls to `http://127.0.0.1:8000`.

### 2.2 User classes

| User class | Permissions in MVP |
|---|---|
| Guest | Browse, search, filter, and view aggregate counts. Cannot view contact instructions or create/update/delete reports. |
| Signed-in demo student | Guest permissions plus create a report, request contact instructions, and manage their own reports. |
| Moderator | Not implemented in MVP; planned for Beta. |

### 2.3 Operating environment

- Current desktop or mobile browser.
- Node.js 20+ and npm for frontend development.
- Python 3.10+ for backend development.
- FastAPI / Uvicorn and SQLite.
- GitHub Codespaces or a compatible local development environment.

### 2.4 Constraints

- The required technology stack is React + TypeScript and FastAPI + Python.
- The MVP has no trusted connection to IUB's student information system.
- SQLite is appropriate for a coursework demo; a managed database is recommended before public production use.
- The official IUB logo is referenced from the public IUB website, with a local monogram fallback.

### 2.5 Assumptions and dependencies

- The student provides a Student ID, full name, and phone number; WhatsApp and extra contact details are optional.
- The API and database are reachable when the frontend is running.
- The board may contain fictitious seeded sample content for presentation purposes.
- A future institutional release depends on an approved university identity integration and hosting approval.

## 3. Functional requirements

### 3.1 Authentication and session

- **SRS-FR-001 (MVP):** Accept a Student ID, full name, and valid phone number; accept optional WhatsApp and extra contact details; return a bearer token plus the student profile.
- **SRS-FR-002 (MVP):** Store only a SHA-256 hash of the random session token in the database; the token expires after seven days.
- **SRS-FR-003 (MVP):** `GET /api/auth/me` returns the current session's student identity.
- **SRS-FR-004 (MVP):** Logout invalidates the current stored session and removes the token from frontend local storage.
- **SRS-FR-005 (Beta):** Replace demo identity entry with verified IUB SSO; do not treat student-entered details alone as verified authentication.

### 3.2 Report board

- **SRS-FR-006 (MVP):** List reports newest first and default to `open` status.
- **SRS-FR-007 (MVP):** Search title, description, category, and location using a case-insensitive keyword.
- **SRS-FR-008 (MVP):** Filter by report type (`lost` / `found`), supported category, and status (`open` / `resolved` / `all`).
- **SRS-FR-009 (MVP):** Return no more than 100 reports for one list request.
- **SRS-FR-010 (MVP):** Return aggregate counts for reports, open reports, resolved reports, lost reports, and found reports.

### 3.3 Create and manage reports

- **SRS-FR-011 (MVP):** Only a signed-in student can create a report.
- **SRS-FR-012 (MVP):** Required report input: title, description, category, report type, location, and contact instructions. Incident date and item photo are optional; photos must be JPG/PNG/WebP and at most 2 MB.
- **SRS-FR-013 (MVP):** Validate lengths, supported categories, and allowed report type values at the API boundary.
- **SRS-FR-014 (MVP):** A report starts with status `open`.
- **SRS-FR-015 (MVP):** Only the report owner can update status to `open` or `resolved`.
- **SRS-FR-016 (MVP):** Only the report owner can delete a report.
- **SRS-FR-017 (MVP):** A rejected or unauthenticated mutation returns an appropriate HTTP error without changing data.

### 3.4 Contact protection

- **SRS-FR-018 (MVP):** Guest list responses omit contact instructions.
- **SRS-FR-019 (MVP):** A signed-in user can request reporter phone/WhatsApp details, optional extra contact information, and report-specific contact instructions for an existing report.
- **SRS-FR-020 (MVP):** A request for a nonexistent report returns HTTP 404.
- **SRS-FR-021 (Beta):** Add abuse reporting, automated redaction of sensitive card data, and moderator review.

## 4. External interface requirements

### 4.1 User interface

The frontend must be responsive on phones, tablets, and desktops. It must offer a landing/hero area, a searchable report board, filters, sign-in form, report creation form, contact dialog, owner controls, safety guidance, and clear loading/error/empty states.

### 4.2 API interface

JSON requests and responses use the `/api` prefix. Authenticated endpoints accept `Authorization: Bearer <token>`. Errors use FastAPI's JSON `detail` field where possible.

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Check API status. |
| POST | `/api/auth/login` | Public | Create demo session. |
| GET | `/api/auth/me` | Signed in | Read current student profile. |
| POST | `/api/auth/logout` | Public-safe / token-aware | Invalidate current session when a token is supplied. |
| GET | `/api/stats` | Public | Read aggregate counts. |
| GET | `/api/items` | Public | Browse/search/filter reports; contact instructions remain hidden. |
| POST | `/api/items` | Signed in | Create a report. |
| GET | `/api/items/{id}/contact` | Signed in | Read reporter contact details and report-specific instructions. |
| GET | `/api/items/{id}/image` | Public | Serve a report photo if one is attached. |
| PATCH | `/api/items/{id}/status` | Owner only | Update a report's status. |
| DELETE | `/api/items/{id}` | Owner only | Delete a report. |

### 4.3 Software interfaces

- Browser to Vite frontend through HTTP during development.
- Frontend to FastAPI through Vite `/api` proxy during development.
- FastAPI to SQLite using SQLAlchemy.
- Beta: managed PostgreSQL, IUB SSO, controlled file storage, deployment secrets, and HTTPS.

## 5. Data requirements

### 5.1 Student

- `id`: server-generated primary key.
- `student_id`: unique, normalized, required string.
- `full_name`: required display name.
- `phone_number`: required contact phone captured at demo sign-in.
- `whatsapp_number`: optional WhatsApp number; if omitted, use the phone number.
- `extra_contact_info`: optional additional contact details.
- `created_at`: creation timestamp.

### 5.2 AuthSession

- `token_hash`: SHA-256 hash of token; primary key.
- `student_pk`: reference to a Student.
- `expires_at`: session expiration timestamp.
- `created_at`: creation timestamp.

### 5.3 Item

- `id`: server-generated primary key.
- `title`, `description`, `category`, `report_type`, `location`: required item details.
- `incident_date`: optional date.
- `contact_info`: required report-specific contact instructions, returned only by the contact endpoint for authenticated users.
- `image_data`: optional base64 data URL stored in SQLite; the API exposes photos through `/api/items/{id}/image` rather than embedding large image data in each board response.
- `status`: `open` or `resolved`; new reports default to `open`.
- `owner_id`: reference to the creating Student.
- `created_at`: server-generated creation timestamp.

## 6. Non-functional requirements

- **SRS-NFR-001 — Usability:** A new user should be able to search the board without sign-in and submit a report with a short, labelled form.
- **SRS-NFR-002 — Responsive design:** Layout must adapt to viewport widths from 320px through desktop sizes.
- **SRS-NFR-003 — Performance:** Common list/search requests should complete quickly for a classroom-sized dataset (target under 1 second on a typical local/Codespaces environment; not a production SLA).
- **SRS-NFR-004 — Data integrity:** Required fields, enumerations, and foreign keys must be validated before writes.
- **SRS-NFR-005 — Authorization:** Status updates and deletes must be restricted to the report owner.
- **SRS-NFR-006 — Privacy:** Contact instructions must not be included in anonymous board responses.
- **SRS-NFR-007 — Maintainability:** Backend models, schemas, API logic, frontend API calls, and UI components should be separated into understandable modules.
- **SRS-NFR-008 — Portability:** Application must run from documented commands in a local environment or Codespaces.
- **SRS-NFR-009 — Transparency:** All visible demo sign-in is labelled as unverified; sample people/items are fictitious.
- **SRS-NFR-010 — Accessibility:** Inputs have labels, actions have accessible names, status is not communicated by color alone, and focus states remain visible.

## 7. Error handling

| Situation | Expected response |
|---|---|
| Missing or invalid token for protected action | HTTP 401 |
| User tries to edit/delete another student's report | HTTP 403 |
| Report does not exist | HTTP 404 |
| Invalid request fields | HTTP 422 |
| Backend cannot be reached | Frontend displays a clear connection error and recovery hint. |

## 8. Verification plan

- Run backend smoke tests for health, board reads, and sign-in.
- Build the frontend using `npm run build`.
- Manual flow: guest board search → sign in → create report → view contact instructions → mark own report resolved → delete own report.
- Authorization checks: attempt to update/delete an item owned by another user and expect HTTP 403.
- Privacy check: anonymous list responses do not include contact instructions.
- Beta verification: test institutional SSO, roles, moderation, database migration, deployment secrets, and backups before any real deployment.


## Contact profile and item photos

- **MVP:** Student sign-in requires a student ID, full name, and phone number. WhatsApp number and extra contact information are optional.
- **MVP:** Signed-in students can attach one JPG, PNG, or WebP photo of up to 2 MB to a report.
- **MVP:** Reporter phone, WhatsApp, profile notes, and report-specific contact instructions are returned only by the authenticated contact endpoint.


## Authentication requirement

- **FR-AUTH-01:** Browsing and searching public reports is permitted without sign-in.
- **FR-AUTH-02:** Creating a report requires a valid signed-in student session.
- **FR-AUTH-03:** A guest who chooses to post must sign in before the report form is made available; successful sign-in continues to the intended report action.
- **FR-AUTH-04:** The API must return `401 Unauthorized` for a report-creation request with no valid bearer session.
