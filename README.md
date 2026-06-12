# LifeOS AI

> A personal AI operating system that helps students, employees, managers, business owners, families and general users manage their daily life — tasks, reminders, calendar, notes, documents, expenses, learning and more — through a single AI-powered assistant.

This repository is built **in phases** (see [Build roadmap](#build-roadmap)). It is a real, production-grade foundation — no mock data, no fake implementations.

---

## Current status

| Phase | Scope | Status |
|------|-------|--------|
| **1** | Project setup, Authentication, Database, Basic UI | ✅ Done |
| **2** | AI Assistant, Chat, Memory | ✅ Done |
| **3** | Tasks, Reminders, Calendar | ✅ Done |
| **4** | Documents, AI processing | ✅ Done |
| **5** | Expenses, Analytics | ✅ Done |
| **6** | Mobile application (React Native) | ✅ Done |
| **7** | Deployment | ✅ Done |

### What works today (Phase 1)
- Email/password **registration & login** with strong validation.
- **JWT access tokens** (stateless) + **rotating, revocable refresh tokens** (hashed at rest).
- Role-based authorization (`USER`, `ADMIN`) and a protected `/api/users/me` endpoint.
- PostgreSQL schema managed by **Flyway** migrations.
- React web app: **landing, login, register, dashboard** with protected routes and automatic token refresh.
- OpenAPI/Swagger docs, global error handling, CORS, Dockerised stack, CI pipeline, automated tests on both sides.

### What works in Phase 2 (AI Assistant)
- **Conversational chat** with persistent conversations and message history.
- **Short-term memory**: recent messages in a conversation are sent as context (configurable window).
- **Long-term memory**: durable user preferences (e.g. "reminders after 7 PM") are stored and injected into every prompt's system context.
- **Provider-agnostic LLM layer** (`LlmClient`) with a real OpenAI Chat Completions implementation. It activates when `OPENAI_API_KEY` is set; if not configured, the API returns an honest `503` (no fabricated replies).
- Chat UI with conversation sidebar, optimistic sending, and auto-titled conversations.

> To enable live AI replies, set `OPENAI_API_KEY` in `.env` (or point `AI_BASE_URL` at any OpenAI-compatible endpoint such as a local server).

### What works in Phase 3 (Tasks, Reminders, Calendar)
- **Tasks**: CRUD with title, description, priority (LOW/MEDIUM/HIGH/URGENT), status (PENDING/IN_PROGRESS/COMPLETED/CANCELLED), category, due date, **subtasks**, **projects**, free-text **search**, status filtering, and a **reorder** endpoint backing drag-and-drop. UI is a 4-column board.
- **Reminders**: one-off, **recurring** (DAILY/WEEKLY/MONTHLY/YEARLY) and **location** reminders, with PUSH/EMAIL/BOTH channel preference and ACTIVE/COMPLETED/CANCELLED lifecycle.
- **Calendar**: events with start/end, location, all-day flag, time-range validation, and a range query. UI groups events by day.

> Actual push/email *delivery* (FCM/SMTP) is a later integration that needs provider credentials; the data model, scheduling fields (`remindAt`, recurrence advance) and APIs are all in place.

### What works in Phase 4 (Document AI Vault)
- **Upload** PDF, Word, images and text files (multipart, 25 MB limit). Files are stored via a pluggable **`StorageService`** — **local disk by default** (zero setup, works on the H2 `local` profile), with an **S3-ready** seam (`lifeos.storage.provider=s3`) so cloud storage drops in without touching callers.
- **Text extraction** with Apache Tika (PDF/Word/text out of the box; image OCR if Tesseract is installed).
- **Automatic classification** into Bill / Insurance / Certificate / ID / Receipt / Bank / Medical / Education / Tax / Contract / Other via a deterministic, explainable keyword classifier.
- **Lexical search** across title, filename and extracted text.
- **Ask your documents (RAG)**: keyword retrieval over your docs feeds the LLM to answer questions like *"When does my insurance expire?"* — using **lexical retrieval** so it works on H2 *and* PostgreSQL with **no vector database required**. It returns the answer plus its source documents, says so honestly when nothing matches, and returns a clear `503` when no AI key is configured.

> Storage choice: **local disk is the default** so the app runs with zero setup. Set `STORAGE_PROVIDER=s3` (+ `S3_*` vars) to use S3-compatible storage once an implementation/credentials are supplied.

### What works in Phase 7 (Deployment)
Production-ready delivery for the whole stack:
- **Hardened images**: multi-stage `backend/Dockerfile` (non-root, container-aware JVM `-XX:MaxRAMPercentage`, `HEALTHCHECK` on `/actuator/health`, uploads volume) and `frontend/Dockerfile` (nginx with gzip, security headers, `/healthz`).
- **`docker-compose.prod.yml`**: full stack with datastores kept on an internal network (not published), Redis password auth, required-secret guards, persistent volumes, and `depends_on: service_healthy` ordering.
- **Production profile** (`application-prod.yml`): `ddl-auto=validate`, Flyway-owned schema, forwarded-headers support, graceful shutdown, Swagger UI off by default, and Spring Boot Actuator health/liveness/readiness probes.
- **Secrets**: `.env.production.example` with `openssl`-based generation guidance; nothing sensitive is committed.
- **CI/CD**: `ci.yml` now also builds both Docker images on PRs; `release.yml` publishes versioned images to **GHCR** on `v*.*.*` tags.
- **Guide**: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) covers secrets, launch, TLS proxy, migrations, backups, scaling, cloud options, mobile EAS builds and rollback.

> Quick start (production): `cp .env.production.example .env` → fill secrets → `docker compose -f docker-compose.prod.yml up -d`.

### What works in Phase 6 (Mobile app — React Native + Expo)
A full cross-platform mobile client lives in [`mobile/`](mobile/README.md), built with **Expo SDK 56**, **React Native**, **TypeScript**, **React Navigation**, **React Query** and **Zustand**, talking to the same backend API.
- **Auth** with tokens stored in the device keychain (`expo-secure-store`) + automatic refresh; **AI Assistant** chat with **text-to-speech**; **Tasks**; **Expenses** (totals, category bars, AI insights); **Documents** (scan/upload + ask); **Reminders** (GPS location + on-device local notifications).
- **Native capabilities**: push notifications (`expo-notifications`), camera (`expo-image-picker`), file upload (`expo-document-picker`), location (`expo-location`), voice output (`expo-speech`).
- **Builds**: `eas.json` ships a `preview` profile that produces an installable **Android APK** and a `production` profile for the Play Store **App Bundle** + iOS. Verified end-to-end with `tsc`, `expo-doctor` (21/21) and a full Metro production bundle.

> Voice **input** (speech-to-text) needs a custom dev/EAS build with a native STT module; voice **output** (TTS) ships now and works in Expo Go.

### What works in Phase 5 (Expenses & Analytics)
- **Income & expense tracking**: record transactions with type (INCOME/EXPENSE), amount, currency, category, note and date; edit and delete. Amounts use `BigDecimal` (NUMERIC(15,2)) with a positive-amount check.
- **Categories**: Food, Groceries, Travel, Shopping, Bills, Rent, Health, Education, Entertainment (+ income: Salary, Business, Investment, Gift) and Other.
- **Analytics**: a `/summary` endpoint (totals, net, **expense-by-category breakdown with percentages**, and your **top spending category**) defaulting to the current month, plus a `/monthly` income/expense/net series for the last N months. Aggregation is done in-app so it works identically on **H2 and PostgreSQL** (no DB-specific date functions).
- **AI spending insights**: `/insights` computes the deterministic breakdown then asks the LLM *"where am I spending most and how can I save?"* — returns a friendly analysis, or an honest `503` when no AI key is configured.
- **Dashboard UI**: income/expense/net cards, a 6-month trend bar chart, a category breakdown with progress bars, an add-transaction form, a filterable transaction list, and a one-click AI Insights panel (all charts are dependency-free CSS).

---

## Tech stack

**Frontend (web):** React 18, TypeScript, Vite, Tailwind CSS, shadcn-style UI, React Query, Zustand, React Hook Form, Zod.
**Backend:** Java 21, Spring Boot 3.3, Spring Security, JWT (jjwt), Spring Data JPA, Flyway, OpenAPI (springdoc).
**Data:** PostgreSQL 16 (primary), Redis 7 (caching — wired in later phases).
**DevOps:** Docker, Docker Compose, GitHub Actions.
**Mobile (planned):** React Native + TypeScript.

---

## Project structure

```
LifeOS-AI/
├── backend/                # Spring Boot API (modular: auth, user, security, common, …)
│   ├── src/main/java/com/lifeos/
│   │   ├── auth/           # registration, login, refresh tokens
│   │   ├── user/           # user entity, profile endpoints
│   │   ├── security/       # JWT, filters, Spring Security config
│   │   ├── common/         # base entity, error handling, OpenAPI config
│   │   └── LifeOsApplication.java
│   ├── src/main/resources/ # application.yml + Flyway migrations
│   └── src/test/           # JUnit + MockMvc tests
├── frontend/               # React + Vite web app
│   └── src/
│       ├── components/     # UI primitives + ProtectedRoute
│       ├── pages/          # Landing, Login, Register, Dashboard
│       ├── hooks/          # useAuth (React Query mutations)
│       ├── services/       # axios client + auth service
│       ├── store/          # Zustand auth store
│       ├── lib/            # validations (Zod), utils
│       └── types/          # shared TypeScript types
├── mobile/                 # React Native + Expo app (Android/iOS)
│   ├── App.tsx             # providers + navigation root
│   └── src/
│       ├── screens/        # Login, Home, Assistant, Tasks, Expenses, Documents, …
│       ├── navigation/     # stack + bottom tabs
│       ├── services/       # axios client (+ auto refresh) + feature APIs
│       ├── native/         # notifications, speech (TTS)
│       ├── store/          # Zustand auth store (secure-store backed)
│       └── components/     # shared UI kit
├── docker-compose.yml      # postgres + redis + backend + frontend
├── .github/workflows/      # CI
├── .env.example            # copy to .env
└── docs/                   # architecture & guides
```

---

## Getting started

### Prerequisites
- Java 21+ and Maven 3.9+
- Node.js 20+ and npm
- PostgreSQL 16 (or use Docker Compose), Redis (optional in Phase 1)

### 1. Configure environment
```bash
cp .env.example .env
# Edit .env and set a strong JWT_SECRET and database credentials.
```

### Fastest start — zero external services (H2)
No Docker, PostgreSQL or Redis required. The backend runs on a file-based H2 database under the `local` profile:
```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
```
Then in another terminal:
```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```
Auth, AI memory, tasks, reminders and calendar all work. (AI chat replies still need an API key — see the AI section.) Use the profiles below for real PostgreSQL.

### 2. Run with Docker (easiest — needs Docker Desktop)
```bash
docker compose up --build
# Frontend:  http://localhost:3000
# Backend:   http://localhost:8080
# Swagger:   http://localhost:8080/swagger-ui.html
```

### 3. Run locally without Docker

**Database** — start a PostgreSQL instance and create the `lifeos` database, or just run:
```bash
docker compose up -d postgres redis
```

**Backend**
```bash
cd backend
mvn spring-boot:run
# API on http://localhost:8080, Swagger UI at /swagger-ui.html
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
# App on http://localhost:5173 (proxies /api to :8080)
```

---

## API (Phase 1)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | – | Create an account, returns tokens |
| POST | `/api/auth/login` | – | Authenticate, returns tokens |
| POST | `/api/auth/refresh` | – | Rotate refresh token, new access token |
| POST | `/api/auth/logout` | – | Revoke a refresh token |
| GET  | `/api/users/me` | Bearer | Current user profile |
| GET  | `/api/ai/conversations` | Bearer | List conversations |
| POST | `/api/ai/conversations` | Bearer | Create a conversation |
| GET  | `/api/ai/conversations/{id}/messages` | Bearer | Conversation history |
| POST | `/api/ai/conversations/{id}/messages` | Bearer | Send a message, get AI reply |
| GET  | `/api/ai/preferences` | Bearer | List long-term memory preferences |
| PUT  | `/api/ai/preferences` | Bearer | Create/update a preference |
| DELETE | `/api/ai/preferences/{key}` | Bearer | Delete a preference |
| GET/POST | `/api/tasks` | Bearer | List (filter by `status`/`search`) / create tasks & subtasks |
| PUT/PATCH/DELETE | `/api/tasks/{id}` `…/status` | Bearer | Update / change status / delete |
| POST | `/api/tasks/reorder` | Bearer | Persist drag-and-drop ordering |
| GET/POST/PUT/DELETE | `/api/projects` | Bearer | Manage projects |
| GET/POST/PUT/PATCH/DELETE | `/api/reminders` | Bearer | Manage reminders (time/recurring/location) |
| GET/POST/PUT/DELETE | `/api/calendar/events` | Bearer | Manage calendar events (`from`/`to` range) |
| POST | `/api/documents` | Bearer | Upload a file (multipart); extract + classify |
| GET | `/api/documents` `?category=` | Bearer | List documents |
| GET | `/api/documents/search?q=` | Bearer | Lexical search |
| GET | `/api/documents/{id}` `…/download` | Bearer | Metadata + preview / download original |
| POST | `/api/documents/ask` | Bearer | Ask a question answered from your documents (RAG) |
| DELETE | `/api/documents/{id}` | Bearer | Delete document and stored file |
| GET | `/api/expenses` `?type=&category=&from=&to=` | Bearer | List transactions (filterable) |
| POST | `/api/expenses` | Bearer | Record a transaction (income or expense) |
| PUT/DELETE | `/api/expenses/{id}` | Bearer | Update / delete a transaction |
| GET | `/api/expenses/summary` `?from=&to=` | Bearer | Totals, net and expense-by-category breakdown |
| GET | `/api/expenses/monthly?months=` | Bearer | Income/expense/net series for last N months |
| POST | `/api/expenses/insights` | Bearer | AI analysis of spending (requires AI key) |

Full, interactive docs: **`/swagger-ui.html`**.

---

## Testing

```bash
# Backend (JUnit + MockMvc, runs on in-memory H2)
cd backend && mvn test

# Frontend (Vitest)
cd frontend && npm test
```

---

## Security notes
- Secrets (JWT secret, DB credentials, API keys) are **never** committed — they come from environment variables (`.env`, which is git-ignored).
- Passwords are hashed with BCrypt; refresh tokens are stored only as SHA-256 hashes and are revocable.
- CORS origins are configurable; the API is stateless (no server sessions).

---

## Build roadmap

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full design and how each upcoming module (AI/RAG, tasks, calendar, documents, expenses, mobile) fits into the modular architecture.
