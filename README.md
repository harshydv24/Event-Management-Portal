<div align="center">

# 🎟️ Event Management Portal (Event Nexus)

**A role-based, full-stack web application for campus event proposal, approval, venue allocation and student registration.**

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?logo=firebase&logoColor=black)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socket.io&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

</div>

---

## 📑 Table of Contents

- [About](#-about)
- [Key Features](#-key-features)
- [User Roles](#-user-roles)
- [Event Lifecycle](#-event-lifecycle)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Real-Time Events](#-real-time-events-socketio)
- [Data Model](#-data-model)
- [Security](#-security)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Known Limitations](#-known-limitations)
- [Roadmap](#-roadmap)
- [Authors](#-authors)

---

## 📖 About

Colleges run a constant stream of talks, workshops, cultural programmes and club activities. Every event needs department permission, a free venue, publicity and a way for students to register. At most institutions this still relies on paper proposals, messaging groups and spreadsheets, which leads to slow approvals, clashing bookings, missed announcements and unreliable participant records.

**Event Nexus** digitises the entire lifecycle of a campus event in one portal:

1. A **club** submits an event proposal with a poster, a proposal PDF and a minutes-of-meeting (M2M) PDF.
2. The **department** approves or rejects it with written feedback, then assigns a venue and time from a predefined list.
3. **Students** discover events in a searchable catalogue and register individually or as a team.
4. Everyone gets **in-app notifications** and **live screen updates** without refreshing the page.

> Developed as a B.E. (Computer Science & Engineering) project at **Chandigarh University**, Academic Year 2026–27.

---

## ✨ Key Features

**Authentication & accounts**
- Sign up with name, e-mail, password and role (students also provide a university ID)
- Mandatory **e-mail verification** before any dashboard is reachable (resend with cool-down)
- Login is rejected if the selected portal does not match the stored role

**Students**
- Browse events open for registration, with search and club/status filters
- View event details: date, time, venue, guest, club, poster and seats registered vs. expected
- Register **individually** or as a **team**; duplicate individual registration is blocked
- Notifications with mark-as-read / mark-all-as-read

**Clubs**
- Club profile: description, logo, faculty advisor, president, core team (carousel)
- Create event proposals with poster, proposal PDF and M2M PDF uploads
- Track every proposal's status and department feedback
- Edit/delete own events, view participant lists, post announcements

**Department**
- Dashboard counters and tabs for All / Pending / Approved / Rejected events
- Approve, or reject with written feedback
- Assign a venue and time from a predefined list
- Searchable club list with per-club pending / approved / rejected counts; manage clubs and list users by role

**Platform**
- Real-time updates over **Socket.IO** (user, role and club rooms)
- Light and dark themes, responsive layout, accessible components (Radix UI)
- File uploads (JPEG, PNG, GIF, WebP, PDF; 10 MB max) with optional **Cloudinary** storage
- Zod-validated forms, client-side rate limiting, consistent JSON error format
- One-command **Docker Compose** deployment

---

## 👥 User Roles

| Operation | Student | Club | Department |
|-----------|:-------:|:----:|:----------:|
| View events, clubs, announcements | ✅ | ✅ | ✅ |
| Create event proposal | ❌ | ✅ | ❌ |
| Edit / delete event | ❌ | Own club only | ✅ |
| Select venue and time | ❌ | ❌ | ✅ |
| Register for an event | ✅ | ✅* | ✅* |
| Create / update club | ❌ | Own club | ✅ |
| Delete club | ❌ | ❌ | ✅ |
| Post announcement | ❌ | ✅ | ✅ |
| List all users | ❌ | ❌ | ✅ |

\* Route is open to any signed-in user; the UI exposes registration to students.

---

## 🔄 Event Lifecycle

```
 club submits            department              venue + time           event held
  proposal   ┌──────────────────┐ approves ┌──────────┐ assigned ┌────────────────┐        ┌───────────┐
 ──────────▶ │ pending_approval │ ───────▶ │ approved │ ───────▶ │ venue_selected │ ─────▶ │ completed │
             └──────────────────┘          └──────────┘          └────────────────┘        └───────────┘
                      │ rejects (+ feedback)
                      ▼
                 ┌──────────┐
                 │ rejected │
                 └──────────┘
```

Students only see events in the `venue_selected` or `completed` state. Rejected events keep the department's feedback so the club can understand the decision.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite (SWC), Tailwind CSS, shadcn/ui (Radix UI), React Router, React Hook Form, Zod, next-themes |
| **Backend** | Node.js 20+, Express 4, TypeScript |
| **Database** | MongoDB 7 with Mongoose 8 |
| **Authentication** | Firebase Authentication (client) + Firebase Admin SDK (server token verification) |
| **Real-time** | Socket.IO 4 |
| **Uploads** | Multer, optional Cloudinary |
| **Testing** | Vitest, Testing Library, jsdom |
| **DevOps** | Docker, Docker Compose, Nginx (Alpine), Vercel / Render configs |

---

## 🏗️ Architecture

Event Nexus is a **decoupled three-tier** system. The browser never talks to the database directly; every operation goes through the Express API with a Firebase ID token.

```
┌─────────────────────────────┐
│  Presentation (React SPA)   │  Pages · Context providers · Service layer · API client · Socket client
└──────────────┬──────────────┘
               │ HTTPS / JSON  +  WebSocket
┌──────────────▼──────────────┐
│  Application (Express API)  │  CORS → body parser → rate limit → verifyToken → requireProfile → requireRole → controller → errorHandler
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│  Data / External services   │  MongoDB · Firebase Auth · Cloudinary / local uploads
└─────────────────────────────┘
```

**Hybrid authentication:** Firebase answers *"who is this?"* and the application's own database answers *"what may this person do?"*. The API verifies each ID token with the Admin SDK, then applies role-based access control from the profile stored in MongoDB.

---

## 📁 Project Structure

```
Event-Management-Portal/
├── docker-compose.yml          # MongoDB + backend + frontend (Nginx)
├── server/                     # Express + TypeScript API
│   ├── src/
│   │   ├── index.ts            # App bootstrap
│   │   ├── config/             # Firebase Admin, Socket.IO, DB
│   │   ├── middlewares/        # auth (verifyToken), rbac (requireRole), upload, errorHandler
│   │   ├── controllers/        # auth, event, club, announcement, notification, upload
│   │   ├── models/             # User, Event, Club, Announcement, Notification
│   │   └── routes/             # /api/* routers
│   ├── scripts/
│   │   └── migrateFromFirestore.ts
│   ├── Dockerfile
│   └── .env.example
└── event-nexus-main/           # React + Vite frontend
    ├── src/
    │   ├── pages/              # Student, Club, Department, Login, VerifyEmail
    │   ├── components/         # EventCard, NotificationPanel, DashboardLayout, ProtectedRoute, ...
    │   ├── contexts/           # AuthContext, EventContext, NotificationContext
    │   ├── services/           # auth, event, club, announcement, notification, storage
    │   ├── api/client.ts       # Fetch wrapper that injects the Bearer token
    │   ├── lib/                # validationSchemas.ts, rateLimiter.ts, errorUtils.ts
    │   └── config/             # rateLimitConfig.ts
    ├── Dockerfile
    └── DESIGN.md               # Visual language / design tokens
```

> Folder names inside `src/` reflect the layered design described in the project report; check the repository for the exact file layout.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) **20 or newer** and npm
- [Git](https://git-scm.com/)
- A **Firebase project** with Email/Password Authentication enabled, plus a service-account key
- **MongoDB 7** (local container) or a [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- *(Optional)* [Docker](https://www.docker.com/) and Docker Compose; a [Cloudinary](https://cloudinary.com/) account

### 1. Clone the repository

```bash
git clone https://github.com/harshydv24/Event-Management-Portal.git
cd Event-Management-Portal
```

### 2. Run the backend

```bash
cd server
cp .env.example .env        # then fill in MongoDB URI and Firebase credentials
npm install
npm run dev                 # tsx watch, hot reload on http://localhost:5000
```

Verify it is up: `GET http://localhost:5000/api/health` → `{ "status": "ok", "timestamp": "..." }`

### 3. Run the frontend

```bash
cd event-nexus-main
# create a .env with the VITE_FIREBASE_* and VITE_API_BASE_URL variables (see below)
npm install
npm run dev
```

Open the URL printed by Vite in your terminal.

### 4. (Optional) Migrate data from the Firestore prototype

```bash
cd server
npm run migrate
```

Copies users, events, clubs, announcements and notifications from Firestore into MongoDB and prints found / migrated / failed counts per collection.

### Run everything with Docker Compose

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend (Nginx) | http://localhost:8080 |
| API health check | http://localhost:5000/api/health |
| MongoDB | `localhost:27017` |

Nginx serves the static bundle and proxies `/api/`, `/uploads/` and `/socket.io/` to the backend. The default MongoDB URI points to the bundled container; set `MONGODB_URI` to use Atlas instead.

---

## 🔐 Environment Variables

### Backend — `server/.env`

| Variable | Purpose |
|----------|---------|
| `PORT` | API port (default `5000`) |
| `MONGODB_URI` | MongoDB connection string (default: local `event-nexus` database) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` **or** `FIREBASE_SERVICE_ACCOUNT_PATH` | Service-account credentials (JSON string or file path) |
| `CORS_ORIGIN` | Additional allowed browser origin |
| `NODE_ENV` | `production` makes CORS strict |
| `UPLOAD_DIR` | Local upload directory |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER` | Optional cloud media storage |

### Frontend — `event-nexus-main/.env`

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` | Firebase web-app config (public by design) |
| `VITE_API_BASE_URL` | Express API base URL (default `http://localhost:5000/api`) |
| `VITE_RL_*` | Optional overrides for client-side rate-limit tiers |

> ⚠️ **Never commit** `.env` files or the Firebase service-account key. If a key has ever been committed, rotate it.

---

## 📡 API Reference

All routes are prefixed with `/api` and require `Authorization: Bearer <Firebase ID token>` unless marked public. Errors share one shape: `{ "error": "...", "message": "..." }`.

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| GET | `/health` | Public | Liveness check |
| POST | `/auth/sync` | Token only | Create MongoDB profile after sign-up (idempotent) |
| GET | `/auth/profile` | Any | Current user's profile |
| PUT | `/auth/profile` | Any | Update own name (and university ID for students) |
| GET | `/auth/users?role=` | Department | List users, optionally by role |
| GET | `/events?clubId=&status=` | Any | List events (newest first) |
| GET | `/events/:id` | Any | Single event |
| POST | `/events` | Club | Create proposal (status forced to `pending_approval`) |
| PUT | `/events/:id` | Club (own) / Department | Update event |
| PUT | `/events/:id/status` | Department / Club | Set status + optional feedback |
| PUT | `/events/:id/venue` | Department | Set venue and time → `venue_selected` |
| POST | `/events/:id/register` | Any | Register one participant (409 on duplicate) |
| POST | `/events/:id/register-team` | Any | Register an array of team members |
| DELETE | `/events/:id` | Club (own) / Department | Delete event |
| GET | `/clubs`, `/clubs/:id` | Any | List / fetch clubs |
| POST | `/clubs`, `/clubs/:id` | Department / Club | Create club (second form uses a given ID) |
| PUT | `/clubs/:id` | Department / Club (own) | Update club |
| DELETE | `/clubs/:id` | Department | Delete club |
| GET | `/announcements?clubId=` | Any | List announcements |
| POST | `/announcements` | Club / Department | Create announcement |
| DELETE | `/announcements/:id` | Author / Department | Delete announcement |
| GET | `/notifications` | Any | Own notifications |
| POST | `/notifications` | Any | Create a notification for a user |
| POST | `/notifications/broadcast` | Any | Notify all users matching a role and/or club |
| PUT | `/notifications/read-all` | Any | Mark all own notifications as read |
| PUT | `/notifications/:id/read` | Owner | Mark one as read |
| POST | `/upload` | Any | Upload one image or PDF (field `file`) |
| POST | `/upload/multiple` | Any | Upload up to 5 files (field `files`) |

### Example requests

```http
# Club creates an event
POST /api/events
Authorization: Bearer <ID_TOKEN>
Content-Type: application/json

{
  "name": "Hack the Campus",
  "description": "24-hour hackathon",
  "date": "2026-12-05",
  "expectedParticipants": 120,
  "guestName": "Industry mentor",
  "clubId": "<club id>",
  "clubName": "Coding Club",
  "poster": "<url>", "proposalPdf": "<url>", "m2mPdf": "<url>"
}
→ 201  event with status "pending_approval" and participants []
```

```http
# Department assigns venue and time
PUT /api/events/:id/venue
{ "venue": "C1 Auditorium", "time": "10:00" }
→ event with status "venue_selected"
```

```http
# Student registers individually
POST /api/events/:id/register
{
  "studentId": "<firebase uid>", "studentName": "Student Name",
  "studentUid": "<university id>", "studentEmail": "student@example.edu",
  "studentBranch": "CSE", "studentSec": "A", "eventId": "<event id>"
}
→ 201  { "participant": { "id": "<uuid>", "registeredAt": "..." } }
→ 409  { "error": "Duplicate registration", "message": "You are already registered for this event." }
```

**Predefined venues:** C1 Auditorium (500), C3 Auditorium (300), B1 Hall (150), D7 Conference Room (80), Open Air Theatre (1000), Seminar Hall (200).

---

## ⚡ Real-Time Events (Socket.IO)

Clients may pass their Firebase ID token on connect; verified sockets join private rooms.

| Room | Members | Messages |
|------|---------|----------|
| `events` | Every client | `event:created`, `event:updated`, `event:deleted`, `club:updated` |
| `announcements` | Every client | `announcement:created` |
| `user:<uid>` | One user | `notification:new` |
| `role:<role>` | All users of a role | `notification:new`, `event:created` (department) |
| `club:<clubId>` | Members of a club | `event:updated`, `event:deleted`, `notification:new` |

A 60-second periodic fetch on the client acts as a fallback if the socket connection drops.

---

## 🗄️ Data Model

MongoDB stores five collections (relationships use string IDs; participants are embedded in their event):

| Collection | Key fields |
|------------|-----------|
| `users` | `_id` (= Firebase UID), `email`, `name`, `role` (`student` / `club` / `department`), `uid` (university ID), `clubId` |
| `events` | `name`, `description`, `date`, `time`, `venue`, `expectedParticipants`, `guestName`, `poster`, `proposalPdf`, `m2mPdf`, `clubId`, `clubName`, `status`, `feedback`, `participants[]` |
| `clubs` | `name`, `description`, `logo`, `facultyAdvisor`, `president`, `coreTeam[]`, `eventsCount` |
| `announcements` | `title`, `content`, `clubId`, `clubName`, `authorId`, `authorName` |
| `notifications` | `userId`, `role`, `message`, `relatedEventId`, `isRead` |

Indexes cover the common queries (events by `clubId` / `status` / `createdAt`, users by `role` / `clubId`, notifications by `userId`).

---

## 🛡️ Security

- Firebase ID tokens verified on **every** request; passwords never reach the application's servers
- Server-side role checks (`requireRole`) and ownership checks on club-owned resources
- E-mail verification required before accessing any dashboard
- CORS allow-list (strict when `NODE_ENV=production`)
- Global API rate limit of **200 requests / 15 min / IP**; client-side tiers for auth (5 per 15 min with exponential back-off), public reads, writes and e-mail resends
- Upload type and size restrictions with random UUID file names
- API container runs as a **non-root** user; multi-stage builds ship only production dependencies
- Secrets come from environment variables or mounted files, never hard-coded

---

## 🧪 Testing

```bash
cd event-nexus-main
npm test        # Vitest unit tests
npm run lint    # ESLint
```

Automated tests currently cover the **client-side validation schemas** and the **rate limiter** (roughly 130 test blocks, counted statically). The report also includes a 24-case functional test plan (authentication, RBAC, ownership checks, registration rules, uploads, live updates, Docker smoke test).

There are currently **no automated tests for the Express API or end-to-end journeys**.

---

## ☁️ Deployment

| Component | Recommended option |
|-----------|--------------------|
| Full stack (single host) | `docker compose up --build` |
| Frontend | Vercel (`vercel.json` rewrites routes to `index.html` and caches hashed assets) |
| Backend | Render-style platforms (`render:build` script; provide `FIREBASE_SERVICE_ACCOUNT_JSON` and `CORS_ORIGIN`) |
| Database | MongoDB Atlas |
| Media | Cloudinary (local `/uploads` volume works for single-host setups) |

---

## ⚠️ Known Limitations

This is a working campus prototype. A self-review documented these items to address before a wider roll-out:

1. **Status endpoint authorisation** – `PUT /events/:id/status` accepts club users and does not validate legal transitions; restrict approve/reject to the department.
2. **Notifications** are created from the browser and the create/broadcast endpoints are open to any signed-in user; move them server-side.
3. **Client-supplied `clubId` / `clubName`** on event creation should be derived from the authenticated user.
4. **Registration rules** – capacity is displayed but not enforced; team registration has no duplicate check; the duplicate check is not atomic; team name is not stored.
5. **Validation** – Zod schemas run only in the browser; reuse them on the server.
6. **Rate limiting** – detailed tiers are client-side only; add per-route server limits.
7. **Analytics** – dashboards show counters only (no charts yet).
8. **File handling** – local storage is ephemeral without a volume, the base64 fallback can create very large documents, and PDFs are not scanned.
9. **Visibility** – approved events without a venue are hidden from students.
10. **Credential hygiene** – keep `.env` files and service-account keys out of version control.
11. **Docs** – the frontend README previously described the Firestore-only architecture.
12. **Tests** – no backend or end-to-end test suites yet.

---

## 🗺️ Roadmap

**Short term**
- [ ] Server-side authorisation and status-transition rules with an audit trail
- [ ] Capacity enforcement, cancellation and waiting lists
- [ ] Venue clash detection and a venue calendar
- [ ] Server-driven notifications
- [ ] Shared server-side validation, API integration tests and CI

**Medium term**
- [ ] QR-code tickets, attendance check-in and CSV/PDF participant exports
- [ ] Graphical analytics (trends, branch-wise participation, events per club/month)
- [ ] E-mail / SMS / push notifications
- [ ] Certificates and post-event feedback forms
- [ ] Calendar integration (ICS / Google Calendar)

---

## 👨‍💻 Authors

| Name | Roll No. | GitHub |
|------|----------|--------|
| **Harsh Yadav** | 24BCS10120 | [@harshydv24](https://github.com/harshydv24) |
| **Ankit Kumar** | 24BCS10866 | — |

Bachelor of Engineering in Computer Science & Engineering, **Chandigarh University**.

---

## 🙏 Acknowledgements

React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Radix UI, Express, MongoDB, Mongoose, Socket.IO, Firebase and Cloudinary, and the open-source communities behind them.
