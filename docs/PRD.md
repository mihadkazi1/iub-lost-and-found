# Product Requirements Document (PRD)

**Product:** IUB Lost & Found  
**Course:** CSE309  
**Document status:** MVP assessment baseline, version 1.2  
**Product type:** Responsive campus web application

## 1. Product summary

IUB Lost & Found is a lightweight campus community board for students at Independent University, Bangladesh (IUB). It helps students report belongings they have lost, publish items they have found, search existing reports, and coordinate a safe return.

This is an independent CSE309 classroom demonstration project. It is not an official IUB service, and the demo sign-in does not verify enrolment or identity.

## 2. Problem statement

Lost belongings are often reported in separate Messenger groups, class chats, or in-person conversations. Posts can disappear quickly, details can be difficult to search, and students may not know whom to contact. A single searchable board can make reports easier to find and update.

## 3. Product goals

1. Give the IUB student community one simple place to browse lost and found reports.
2. Let a student create and manage a report with clear item, date, and campus-location details.
3. Make searching and category filtering quick on desktop and mobile.
4. Limit contact instructions to signed-in demo users rather than exposing them to every visitor.
5. Demonstrate a coherent React + TypeScript and FastAPI + Python application using REST APIs and persistent data.

## 4. Users and stakeholders

| User | Need |
|---|---|
| Student who lost an item | Publish a report and find a possible match. |
| Student who found an item | Share the details and help locate the owner. |
| Student searching the board | Search by keywords, report type, category, and status. |
| Course instructor / evaluator | Review a working frontend, backend, REST API, and design documents. |
| Future campus administrator (Beta / later) | Moderate misuse and support safe campus handovers. |

## 5. Scope and releases

### Release 1 — MVP (midterm demo)

- **MVP-01:** Responsive landing page and campus report board.
- **MVP-02:** Demo student session using Student ID, full name, and required phone number; WhatsApp number and additional contact details are optional.
- **MVP-03:** Create a lost or found report with title, description, category, campus location, date, optional photo (JPG/PNG/WebP up to 2 MB), and report-specific contact instructions.
- **MVP-04:** Browse reports and search title, description, category, and location.
- **MVP-05:** Filter by Lost / Found, category, and Open / Resolved status.
- **MVP-06:** View the reporter’s phone number, WhatsApp contact, optional additional contact information, and report-specific instructions after signing in.
- **MVP-07:** Students can open a single report detail view; report owners can edit all report fields, mark a report Resolved or Open, and delete their own report.
- **MVP-08:** REST API backed by a relational database through SQLAlchemy. SQLite is used locally; a managed PostgreSQL URL can be configured for deployment. Includes a small set of seeded example reports.
- **MVP-09:** Public aggregate counts for total, open, lost, found, and resolved reports.
- **MVP-10:** PRD, SRS, and TDD in the repository's `docs/` folder.

### Release 2 — Beta (final demo)

The following are planned, not claimed as implemented in version 1.0:

- **BETA-01:** Verified sign-in through an approved IUB identity provider / SSO.
- **BETA-02:** Role-based access control for Student and Moderator roles.
- **BETA-03:** Student profile dashboard showing a user's own posts and activity.
- **BETA-04:** Moderator tools to review, hide, or remove inappropriate reports.
- **BETA-05:** Configurable security scopes and least-privilege permissions.
- **BETA-06:** Deployment with a managed PostgreSQL database, secrets management, HTTPS, logging, backup, and monitoring.
- **BETA-08:** Optional in-app notifications or matching suggestions.

## 6. Functional requirements and acceptance criteria

| ID | Requirement | Release | Acceptance criteria |
|---|---|---|---|
| FR-01 | Demo student sign-in | MVP | A user can enter a Student ID, full name, and valid phone number, optionally provide a WhatsApp number and additional contact notes, and obtain a demo session token. The interface clearly states this is a demo and not verified identity. |
| FR-02 | Browse board | MVP | The board lists reports newest first and presents type, item name, category, date, location, reporter name, and status. |
| FR-03 | Search and filtering | MVP | Keyword, type, category, and status filters can be combined and reset. |
| FR-04 | Create report | MVP | Signed-in users can submit valid item details and an optional JPG/PNG/WebP photo up to 2 MB; invalid or missing required fields are rejected. |
| FR-05 | Contact instructions | MVP | Guest users cannot fetch contact instructions or reporter phone/WhatsApp details; signed-in users can request these through the API. |
| FR-06 | Read single report | MVP | Selecting Details retrieves one report by ID and displays its complete non-private details. Only the owner may see their own report-specific edit instructions in the edit form. |
| FR-07 | Update report | MVP | Only the report owner can edit report title, description, category, lost/found type, location, incident date, photo, and contact instructions. Omitting a photo during an edit preserves the current photo; explicit removal clears it. |
| FR-08 | Update status | MVP | Only the report owner can change Open / Resolved status. |
| FR-09 | Delete report | MVP | Only the report owner can delete their report. |
| FR-10 | Activity totals | MVP | Counts reflect persisted report data. |
| FR-11 | Session logout | MVP | Logging out invalidates the current server-side session and clears the frontend token. |
| FR-12 | Verified institutional access | Beta | Only verified IUB users can sign in through the institution's approved identity system. |
| FR-13 | Moderation and roles | Beta | Authorized moderators can manage inappropriate reports; ordinary students cannot use moderator actions. |
| FR-14 | Profile dashboard | Beta | A signed-in student can view their own reports and their current status. |

## 7. Non-goals for the MVP

- Official verification or endorsement by IUB.
- A real student information system integration.
- Payments, delivery services, geolocation tracking, or live chat.
- Automated image matching or push notifications.
- A production-grade trust and safety / moderation operation.

## 8. Product principles

- **Keep it small:** focus on the essential lost-and-found journey.
- **Protect details:** contact instructions require a signed-in session and student cards should not be photographed or described with sensitive identifiers.
- **Be transparent:** demo access is not official student verification.
- **Make it accessible:** semantic forms, readable contrast, responsive layout, clear errors, and keyboard-operable controls.
- **Use ownership rules:** only an item's reporter can update or delete that report.

## 9. Success measures for the demo

- A fresh workspace starts both applications using the documented commands.
- A visitor can search the seeded board without signing in.
- A student can sign in with a phone number, create a report with an optional photo, open a single report’s details, edit their own report, mark it resolved, reopen it if needed, and delete it. A guest cannot perform any report mutation.
- API validation and ownership rules reject invalid or unauthorized requests.
- The three design documents agree with the implemented MVP and explicitly mark Beta work as future scope.


## Access rule

Visitors may browse and search published reports. Students must sign in before creating a lost/found report or managing their own reports. If a visitor clicks a posting action, the app opens student sign-in first and then takes them to the report form after successful sign-in. The backend rejects report creation without a valid bearer session.
