# Blog Backend Project Plan

Standalone NestJS API repository. The frontend lives in a separate repo and consumes this service via a documented HTTP contract (OpenAPI).

**Stack:** Node.js, NestJS, TypeScript, Prisma, PostgreSQL (with JSONB columns), Pino, Docker.

---

## Phase 1: Environment & Project Initialization

**Objective:** Establish the repository, strict guardrails, and local development environment.

- [*] **Repository Setup:** Initialize Git and immediately commit a strict `.gitignore` covering `node_modules`, `.env`, `dist`, build artifacts, and system logs.
- [*] **Scaffolding:** Bootstrap the project using the NestJS CLI (`nest new blog-backend`).
- [*] **Node Version Pin:** Add `.nvmrc` and/or `engines` in `package.json` so all developers and CI use the same Node version.
- [*] **Strict Quality Gates:**
  - Configure `tsconfig.json` with `"strict": true` and `"noImplicitAny": true`.
  - Configure ESLint and Prettier rules.
  - Set up husky and lint-staged to run the linter and formatter on every local commit.
  - (Optional) Add commitlint for conventional commits and cleaner changelogs.
- [ ] **Secrets Template:** Create a `.env.example` documenting all required variables with dummy values:

  ```env
  DATABASE_URL=postgresql://user:password@localhost:5432/blog_dev
  DATABASE_URL_TEST=postgresql://user:password@localhost:5432/blog_test
  JWT_SECRET=change-me
  JWT_EXPIRES_IN=15m
  PORT=3000
  CORS_ORIGIN=http://localhost:5173
  API_PREFIX=v1
  NODE_ENV=development
  ```

- [ ] **README:** Document local setup: clone, install, `docker compose up`, env copy, migrate, seed, and `npm run start:dev`.

---

## Phase 2: Database Layer & Containerization

**Objective:** Spin up PostgreSQL locally, containerize the app, and establish version-controlled migrations.

> **Note:** "Hybrid database" means PostgreSQL with structured relational columns plus flexible `JSONB` columns — not multiple database engines.

- [ ] **Local Infrastructure:** Create `docker-compose.yml` to spin up a local PostgreSQL instance (pinned image version) so every developer runs the same database.
- [ ] **App Containerization:** Add a multi-stage `Dockerfile` for the NestJS app. Multi-stage builds keep production images small and exclude build-time tooling from the final image.
- [ ] **Prisma Setup:** Initialize Prisma (`npx prisma init`) and point it to the local Docker database via `DATABASE_URL`.
- [ ] **Schema Definition:** Implement the initial `schema.prisma` models:
  - UUID v4 primary keys on all tables (prevents ID enumeration).
  - `Json` type (`JSONB` in PostgreSQL) for flexible `metadata` columns where appropriate.
  - Core entities (initial scope):

    | Model     | Key fields                                                                                      |
    | --------- | ----------------------------------------------------------------------------------------------- |
    | `User`    | `id`, `email`, `passwordHash`, `role`, `metadata`, `createdAt`, `updatedAt`                     |
    | `Post`    | `id`, `title`, `slug`, `content`, `published`, `authorId`, `metadata`, `createdAt`, `updatedAt` |
    | `Comment` | `id`, `body`, `postId`, `authorId`, `metadata`, `createdAt`, `updatedAt`                        |
    | `Tag`     | `id`, `name`, `slug`                                                                            |
    | `PostTag` | join table linking `Post` ↔ `Tag`                                                               |

  - Define relations (`User` → `Post`, `Post` → `Comment`, `Post` ↔ `Tag`) and indexes (`email`, `slug`, `published`).

- [ ] **First Migration:** Run `npx prisma migrate dev --name init` and verify it applies cleanly.
- [ ] **Seed Script:** Add `prisma/seed.ts` for local dev data (admin user, sample posts, tags). Wire via `package.json` `prisma.seed`.
- [ ] **Test Database Strategy:** Document separate `DATABASE_URL_TEST` for e2e tests. CI and local e2e runs target the test database, never dev data.

---

## Phase 3: Cross-Cutting Platform Layer

**Objective:** Implement global infrastructure that every feature module depends on — before writing business features.

- [ ] **Config Validation:** Use `@nestjs/config` with Zod (or Joi) to validate all env vars at boot. Crash immediately if required values (`DATABASE_URL`, `JWT_SECRET`, etc.) are missing or malformed.
- [ ] **Logger Integration:** Replace the default NestJS logger with **Pino** (`nestjs-pino`). All stdout must be structured JSON. Never log passwords, tokens, or other PII.
- [ ] **Correlation ID Middleware:** Assign a `correlationId` (or propagate `X-Request-Id` from the client) on every inbound request. Include it in logs and error responses.
- [ ] **Global Exception Filter:** Catch raw database/system errors, log them internally with the correlation ID, and return a sanitized uniform JSON envelope:

  ```json
  {
    "statusCode": 400,
    "message": "Human-readable summary",
    "errorCode": "VALIDATION_FAILED",
    "correlationId": "uuid"
  }
  ```

  Never leak stack traces, SQL errors, or internal paths to the client.

- [ ] **Validation Pipe:** Enable the global `ValidationPipe` with `class-validator` and `class-transformer`. Strip unknown properties (`whitelist: true`) and reject non-whitelisted fields (`forbidNonWhitelisted: true`).
- [ ] **Security Middleware:**
  - `helmet` for HTTP security headers.
  - `@nestjs/throttler` for rate limiting on auth and write endpoints.
  - Request body size limits.
- [ ] **CORS:** Configure allowed origins from `CORS_ORIGIN` env var (e.g. `http://localhost:5173` for the Vite frontend). Backend owns CORS — the frontend repo cannot configure this.
- [ ] **Health Endpoints:**
  - `GET /health` — liveness (app is running).
  - `GET /ready` — readiness (app can reach the database).
- [ ] **API Versioning & Prefix:** Mount all routes under `/v1` (from `API_PREFIX`). Version in the URL path, not headers.
- [ ] **OpenAPI / Swagger:** Integrate `@nestjs/swagger`. Auto-generate spec from decorators. Expose at `GET /v1/docs` and raw JSON at `GET /v1/docs-json`. This is the **integration contract** for the separate frontend repo.

---

## Phase 4: API Conventions

**Objective:** Define consistent patterns before feature modules so every endpoint behaves predictably.

- [ ] **Response Shape:** Standardize success wrappers where useful (e.g. `{ data, meta }` for collections).
- [ ] **Pagination:** Cursor-based or offset pagination for list endpoints. Query params: `page`, `limit` (max cap enforced server-side). Response `meta` includes `total`, `page`, `limit`.
- [ ] **Sorting & Filtering:** Document supported query params per resource (e.g. `?sort=createdAt:desc&published=true`).
- [ ] **DTO Mapping:** Map Prisma models to response DTOs manually (or via a thin mapper). Never return `passwordHash` or internal fields.
- [ ] **Error Codes:** Maintain a small enum of `errorCode` strings (`VALIDATION_FAILED`, `UNAUTHORIZED`, `NOT_FOUND`, etc.) for frontend handling.
- [ ] **Frontend Integration Contract:** Since repos are separate, the frontend syncs via OpenAPI codegen (`openapi-typescript`, Orval, etc.) against `GET /v1/docs-json`. Optionally commit a generated `openapi.json` on release tags. No shared npm types package unless the team outgrows codegen.

---

## Phase 5: Auth Module

**Objective:** Implement authentication before content features so guards can be applied from the start.

- [ ] **Password Hashing:** Use bcrypt or argon2. Never store or log plaintext passwords.
- [ ] **Registration & Login:** `POST /v1/auth/register`, `POST /v1/auth/login`. Return JWT access token (and optionally refresh token).
- [ ] **JWT Strategy:** `@nestjs/passport` + `passport-jwt`. Validate `JWT_SECRET` and `JWT_EXPIRES_IN` from config.
- [ ] **Auth Guard:** `JwtAuthGuard` protecting routes that require authentication.
- [ ] **Roles Guard (optional):** `RolesGuard` for admin-only operations (e.g. publish post, delete any comment).
- [ ] **Current User Decorator:** `@CurrentUser()` to inject the authenticated user into controllers.
- [ ] **DTOs:** `RegisterDto`, `LoginDto` with strict validation. Response DTO excludes sensitive fields.
- [ ] **Tests:** Unit tests for auth service (hashing, token generation). E2e tests for register/login flows.

---

## Phase 6: Feature Modules (Blog Domains)

**Objective:** Build blog features adhering to layer boundaries. Auth module (Phase 5) must be complete first.

For each domain below, follow the same checklist:

1. Update Prisma schema and run migration.
2. Write service (business logic, domain exceptions).
3. Write controller (HTTP mapping, validation DTOs, guards).
4. Register NestJS module.
5. Add OpenAPI decorators.
6. Add unit tests (service) and e2e tests (critical flows).

### Users

- [ ] `GET /v1/users/me` — authenticated profile.
- [ ] `PATCH /v1/users/me` — update profile (metadata JSONB allowed).
- [ ] Admin: list/manage users (roles guard).

### Posts

- [ ] `GET /v1/posts` — public list (published only); pagination, sort, filter.
- [ ] `GET /v1/posts/:slug` — single post by slug.
- [ ] `POST /v1/posts` — create (authenticated).
- [ ] `PATCH /v1/posts/:id` — update (author or admin).
- [ ] `DELETE /v1/posts/:id` — delete (author or admin).
- [ ] Slug generation and uniqueness validation.

### Comments

- [ ] `GET /v1/posts/:postId/comments` — list comments for a post.
- [ ] `POST /v1/posts/:postId/comments` — create (authenticated).
- [ ] `DELETE /v1/comments/:id` — delete (author or admin).

### Tags

- [ ] `GET /v1/tags` — list all tags.
- [ ] Associate tags with posts via `PostTag` join table.
- [ ] Filter posts by tag slug.

---

## Phase 7: Testing Strategy

**Objective:** Prevent regressions with a clear, layered test approach.

- [ ] **Unit Tests:** Jest tests for services. Mock Prisma client (`jest-mock-extended` or manual mocks). Focus on business logic and edge cases.
- [ ] **E2E Tests:** Supertest against the full Nest app. Use `DATABASE_URL_TEST` with a real Postgres instance (local Docker or Testcontainers).
- [ ] **CI Test DB:** GitHub Actions `services: postgres` (or Testcontainers). Run `prisma migrate deploy` against the test DB before e2e suite.
- [ ] **Critical Flows to Cover:**
  - Auth: register, login, protected route rejection.
  - Posts: CRUD, slug uniqueness, publish/unpublish.
  - Comments: create, delete, authorization.
  - Health/ready endpoints.

---

## Phase 8: CI/CD & Security Automation

**Objective:** Automate quality gates and safe deployment.

- [ ] **CI Pipeline (GitHub Actions):**
  1. Lint and format check.
  2. TypeScript build (`nest build`).
  3. Unit tests.
  4. Spin up Postgres service → `prisma migrate deploy` → e2e tests.
- [ ] **Branch Protection:** Require PRs, passing status checks, and (optionally) linear history on `main`.
- [ ] **Dependency Scanning:** Enable GitHub Dependabot or Snyk. Block merges on critical vulnerabilities.
- [ ] **Deployment:**
  - Run `npx prisma migrate deploy` as a pre-boot step in production.
  - Document rollback policy (Prisma has no automatic down migrations — plan forward-only migrations with corrective follow-ups).
  - Use health/readiness probes against `/health` and `/ready`.
- [ ] **Release Artifacts:** Tag releases with a committed `openapi.json` snapshot for frontend pinning.

---

## Architecture Reference

Request flow for every inbound HTTP call:

```
[ Client Request ]
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ Correlation ID Middleware                              │
│ (Assign or propagate X-Request-Id)                   │
└────────────────────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ Security Middleware (Helmet, Throttler, CORS)         │
└────────────────────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ Global Guards & Validation Pipes                       │
│ (JWT auth, roles, DTO validation, strip unknown fields)│
└────────────────────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ Controller Layer (/v1/...)                             │
│ (HTTP routing, maps inputs to services, OpenAPI docs)  │
└────────────────────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ Service Layer (Business Logic)                         │
│ (Domain rules, maps Prisma models → response DTOs)     │
└────────────────────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ Prisma ORM / Data Access Layer                         │
│ (Strongly typed queries, migrations, seed)             │
└────────────────────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ PostgreSQL                                             │
│ (Relational tables + JSONB metadata columns)           │
└────────────────────────────────────────────────────────┘
```

---

## Out of Scope (Frontend Repo)

These are owned by the separate frontend repository:

- React UI, routing, TanStack Query, Zustand.
- MSW mocks (generated from this repo's OpenAPI spec).
- DOMPurify / XSS sanitization of rendered HTML.
- CORS is configured here; the frontend only needs the correct API base URL.
