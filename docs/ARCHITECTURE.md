# LifeOS AI — Architecture

## 1. Overview

LifeOS AI is a modular monolith designed to be **microservice-ready**. The backend is a single Spring Boot deployable today, but each feature lives in its own package (bounded context) with no cross-module field access, so any module can be extracted into its own service later without rewriting business logic.

```
┌──────────────┐     HTTPS/JSON      ┌────────────────────────────┐
│  Web (React) │ ─────────────────▶ │   Spring Boot API           │
│  Mobile (RN) │                    │  ┌──────────────────────┐   │
└──────────────┘ ◀───────────────── │  │ auth │ user │ ai     │   │
                                     │  │ task │ calendar│ doc │   │
                                     │  │ expense │ notif │ … │   │
                                     │  └──────────────────────┘   │
                                     │   security │ common         │
                                     └───────┬───────────┬─────────┘
                                             │           │
                                       ┌─────▼───┐  ┌────▼────┐   ┌──────────┐
                                       │Postgres │  │  Redis  │   │ S3 / LLM │
                                       └─────────┘  └─────────┘   └──────────┘
```

## 2. Module map

| Module | Responsibility | Phase |
|--------|----------------|-------|
| `security` | JWT issuing/validation, Spring Security config, auth filter | 1 |
| `common` | Base entity, auditing, global error handling, OpenAPI | 1 |
| `user` | User aggregate, profile | 1 |
| `auth` | Registration, login, refresh-token lifecycle | 1 |
| `ai` | LLM integration, embeddings, RAG retrieval, conversation memory | 2 |
| `task` | Tasks, subtasks, projects | 3 |
| `reminder` | Time/location/recurring reminders | 3 |
| `calendar` | Events, scheduling, external calendar sync | 3 |
| `document` | Upload, OCR/text extraction, classification, vault | 4 |
| `expense` | Income/expenses, categories, analytics | 5 |
| `notification` | Push + email delivery | 3+ |
| `storage` | S3-compatible file storage abstraction | 4 |

## 3. Authentication design (Phase 1)

- **Access token**: short-lived (default 15 min) stateless JWT signed with HMAC-SHA256. Subject = user `publicId` (UUID), carries `role`. Validated on every request by `JwtAuthenticationFilter`.
- **Refresh token**: long-lived (default 14 days) opaque random 512-bit token. Only its SHA-256 hash is persisted. On `/auth/refresh` the old token is **revoked and rotated** (reuse-resistant). Logout revokes the presented token.
- **Password storage**: BCrypt.
- **Authorization**: `ROLE_USER` / `ROLE_ADMIN`; method-level security enabled.

### Token flow
```
register/login ──▶ { accessToken, refreshToken }
        access expires ──▶ POST /auth/refresh { refreshToken }
                                   ──▶ { new accessToken, new refreshToken }
        logout ──▶ POST /auth/logout { refreshToken }  (revoked)
```

The web client (`services/api.ts`) automatically refreshes on a `401`, queuing concurrent requests during the refresh.

## 4. Data layer

- **PostgreSQL** is the source of truth. Schema changes are **always** via Flyway migrations in `backend/src/main/resources/db/migration` (`V1__init_auth.sql`, …). `ddl-auto` is `validate` in non-test environments.
- **Auditing**: `BaseEntity` provides `id`, `createdAt`, `updatedAt` via JPA auditing.
- **Public identifiers**: every externally referenced entity exposes a UUID `publicId`; internal numeric ids are never leaked.
- **Redis** is provisioned for caching, rate-limiting and AI short-term memory in later phases.

## 5. AI layer (Phase 2 preview)

```
User message ─▶ ai module
   ├─ Short-term memory: current conversation (Redis)
   ├─ Long-term memory: user preferences + facts (Postgres + vector store)
   ├─ Retrieval (RAG): embed query ▶ vector search ▶ relevant context
   ├─ LLM call: system prompt + memory + retrieved context + tools
   └─ Tool/intent execution: create task, reminder, summarise document, …
```
Embeddings + vector search will use a pgvector extension or a dedicated vector DB; the `ai` module exposes a provider-agnostic interface so the LLM/embedding vendor is swappable via configuration.

## 6. Frontend architecture

- **State**: server state via React Query; auth/session via Zustand (persisted to `localStorage`).
- **Forms**: React Hook Form + Zod resolvers (schemas mirror backend validation).
- **Routing**: React Router with `ProtectedRoute` guarding authenticated areas.
- **UI**: Tailwind + shadcn-style primitives with CSS-variable theming (light/dark ready).

## 7. Security posture

- Secrets via environment variables only; `.env` is git-ignored.
- Stateless API, CSRF disabled (token-based, not cookie-session), configurable CORS allow-list.
- Input validation at the DTO boundary; consistent `ErrorResponse` contract; no stack traces leaked to clients.
- Planned (later phases): request rate limiting (Redis), audit logs, secure file-upload scanning, OAuth2 (Google).

## 8. Deployment targets

- **Frontend** → Vercel (static build) or the provided nginx container.
- **Backend** → AWS (ECS/Elastic Beanstalk/EC2) via the multi-stage Docker image.
- **Database** → AWS RDS for PostgreSQL.
- **CI** → GitHub Actions builds and tests both apps on every push/PR.
