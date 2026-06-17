# blog-backend

Portfolio project — backend API for a blog site. Built with [NestJS](https://nestjs.com/) and TypeScript. The frontend lives in a separate repo and consumes this service via a documented HTTP contract (OpenAPI).

See [project-plan.md](./project-plan.md) for the full roadmap.

## Prerequisites

- [Node.js](https://nodejs.org/) 24 (`nvm use` reads `.nvmrc`)
- [Docker](https://www.docker.com/) (for local PostgreSQL via `docker-compose.yml`)

## Local setup

```bash
# 1. Clone the repository
git clone https://github.com/kevinrion/blog-backend.git
cd blog-backend

# 2. Install dependencies (also installs Husky git hooks)
nvm use
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your local values if needed

# 4. Start PostgreSQL
docker compose up -d

# 5. Apply database migrations
npm run db:migrate
# First run applies prisma/migrations/20250617100000_init (no new name needed)

# 6. Seed development data
npm run db:seed

# 7. Start the API in watch mode
npm run start:dev
```

The API listens on `http://localhost:3000` by default (`PORT` in `.env`).

See [Verify locally](#verify-locally) to confirm the API is working. See [Docker guide](#docker-guide) and [Prisma guide](#prisma-guide) for database details. See [Test database](#test-database) for e2e test setup.

## Verify locally

After `npm run start:dev`, confirm the platform layer and auth module with these checks.

### Health (no auth required)

```bash
# Liveness — app is running (works without Postgres)
curl http://localhost:3000/health

# Readiness — app can reach the database (requires Postgres)
curl http://localhost:3000/ready
```

Expected: `/health` returns `{"status":"ok"}`. `/ready` returns `{"status":"ok"}` when Postgres is up, or `503` with a JSON error envelope when the database is unreachable.

### Auth

Requires Postgres running (`docker compose up -d`) and migrations applied (`npm run db:migrate`).

```bash
# Register a new user
curl -X POST http://localhost:3000/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"securepass123"}'

# Login with seeded admin (after npm run db:seed)
curl -X POST http://localhost:3000/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"changeme"}'

# Access a protected route (replace TOKEN with accessToken from register/login)
curl http://localhost:3000/v1/auth/me \
  -H "Authorization: Bearer TOKEN"
```

Successful register/login responses use the `{ data: { accessToken, user } }` shape. The `user` object never includes `passwordHash`.

### OpenAPI

With the server running, open the interactive docs or fetch the raw spec:

- Swagger UI: [http://localhost:3000/v1/docs](http://localhost:3000/v1/docs)
- OpenAPI JSON: [http://localhost:3000/v1/docs-json](http://localhost:3000/v1/docs-json)

The frontend repo can generate types from `/v1/docs-json` (e.g. with `openapi-typescript` or Orval).

### Correlation ID

Every response includes an `X-Request-Id` header. Pass your own to trace a request through logs:

```bash
curl http://localhost:3000/health -H 'X-Request-Id: my-trace-id' -v
```

### Automated checks

```bash
npm test           # unit tests (no Postgres required)
npm run test:e2e   # e2e tests (requires Postgres + blog_test migrations)
```

## Prisma guide

[Prisma](https://www.prisma.io/) is the ORM for this project. It reads `DATABASE_URL` from `.env` and connects to the PostgreSQL instance started by Docker Compose.

| File / folder        | Purpose                                              |
| -------------------- | ---------------------------------------------------- |
| `prisma/schema.prisma` | Database schema and Prisma Client generator config |
| `prisma/migrations/` | Version-controlled SQL migrations (created in step 5) |

`DATABASE_URL` must match the credentials in `docker-compose.yml`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/blog_dev
```

### Common commands

```bash
# Apply pending migrations (development — also regenerates the client)
npm run db:migrate

# Apply migrations without prompts (CI / production)
npm run db:migrate:deploy

# Regenerate the Prisma Client after schema changes
npm run db:generate

# Open Prisma Studio (visual DB browser) at http://localhost:5555
npm run db:studio
```

The initial migration lives in `prisma/migrations/20250617100000_init/`. It creates all tables, indexes, and foreign keys from the schema. With Postgres running:

```bash
docker compose up -d
npm run db:migrate        # applies init migration to blog_dev
npm run db:migrate:status # confirm all migrations are applied
```

`db:migrate:deploy` is the non-interactive equivalent used in CI and production (no new migration files created).

Run `docker compose up -d` and wait for Postgres to be healthy before running migrations.

### Schema

The initial schema in `prisma/schema.prisma` defines five models:

| Model     | Purpose                                      |
| --------- | -------------------------------------------- |
| `User`    | Accounts (`email`, `passwordHash`, `role`)   |
| `Post`    | Blog posts (`title`, `slug`, `content`, `published`) |
| `Comment` | Comments on posts                            |
| `Tag`     | Labels for posts (`name`, `slug`)            |
| `PostTag` | Join table linking posts ↔ tags              |

All primary keys are UUID v4. `metadata` columns on `User`, `Post`, and `Comment` use PostgreSQL `JSONB` via Prisma's `Json` type. Indexed fields: `User.email`, `Post.slug`, `Tag.slug`, and `Post.published`.

After editing the schema, run `npm run db:migrate` to create a migration and `npm run db:generate` to refresh the client.

### Seed data

`prisma/seed.ts` populates `blog_dev` with local development data. It is **idempotent** (safe to re-run) and targets `DATABASE_URL` only — never the test database.

```bash
# Seed after migrations (requires Postgres running)
npm run db:seed
```

| Seeded data | Details |
| ----------- | ------- |
| Admin user  | `admin@example.com` / `changeme` (dev only — change in production) |
| Posts       | `welcome-to-the-blog` (published), `draft-post` (unpublished) |
| Tags        | `nestjs`, `typescript` |
| Comment     | Sample comment on the welcome post |

Browse seeded data with `npm run db:studio`.

## Test database

Development and tests use **separate databases** on the same Postgres instance:

| Database   | Env var             | Used by                          |
| ---------- | ------------------- | -------------------------------- |
| `blog_dev` | `DATABASE_URL`      | Local dev, migrations, seed, Prisma Studio |
| `blog_test`| `DATABASE_URL_TEST` | E2E tests and CI only            |

`blog_test` is created automatically on first `docker compose up` via `docker/postgres/init-test-db.sql`.

**Rules:**

- Never run `npm run db:seed` against `blog_test` — seed is for dev data only.
- E2E tests always connect via `DATABASE_URL_TEST` (see `test/jest-e2e.setup.ts`).
- `npm run test:e2e` applies migrations to `blog_test` first, then runs the suite.

```bash
# Apply migrations to the test database only
npm run db:migrate:test

# Migrate test DB + run e2e tests
npm run test:e2e
```

In CI (Phase 8), the pipeline will spin up Postgres, run `prisma migrate deploy` against `DATABASE_URL_TEST`, then execute `npm run test:e2e` — same isolation pattern as local runs.

## Docker guide

Local development uses [Docker Compose](https://docs.docker.com/compose/) to run PostgreSQL in a container so every developer gets the same database version and credentials without installing Postgres directly on their machine.

[`docker-compose.yml`](./docker-compose.yml) defines a single `postgres` service:

- **Image:** `postgres:16.6-alpine` (pinned version for consistency)
- **Port:** `5432` on the host maps to the container
- **Databases:** `blog_dev` (default) and `blog_test` (created on first start via `docker/postgres/init-test-db.sql`)
- **Credentials:** `user` / `password` — must match `DATABASE_URL` and `DATABASE_URL_TEST` in `.env`
- **Data:** stored in the `postgres_data` Docker volume so data survives container restarts

### Common commands

```bash
# Start PostgreSQL in the background (detached mode)
docker compose up -d

# Check container status and health
docker compose ps

# Follow database logs
docker compose logs -f postgres

# Open a psql shell against the dev database
docker compose exec postgres psql -U user -d blog_dev

# List databases (should show blog_dev and blog_test)
docker compose exec postgres psql -U user -d blog_dev -c '\l'

# Stop the container (data is kept in the volume)
docker compose stop

# Stop and remove the container (data is still kept in the volume)
docker compose down

# Stop, remove the container, and delete all database data (fresh start)
docker compose down -v
```

### First-time setup

On the first `docker compose up`, Docker pulls the Postgres image and runs the init script in `docker/postgres/init-test-db.sql`. Init scripts only run when the data volume is empty — if you already have a volume from an earlier run, use `docker compose down -v` to wipe it and re-run init.

Wait until the container is healthy before running Prisma migrations:

```bash
docker compose ps
# STATUS should show "healthy" before npx prisma migrate dev
```

### App image (production build)

[`Dockerfile`](./Dockerfile) uses a **multi-stage build** so the final image only contains the compiled app and production dependencies — no TypeScript compiler, ESLint, or test tooling.

| Stage        | Purpose                                              |
| ------------ | ---------------------------------------------------- |
| `builder`    | Installs all deps, runs `npm run build` → `dist/`    |
| `production` | Installs prod deps only, copies `dist/`, runs as `node` user |

```bash
# Build the production image (tags it blog-backend:local)
docker build -t blog-backend:local .

# Run the API container on port 3000
# Pass env vars inline or mount a .env file as needed
docker run --rm -p 3000:3000 \
  -e PORT=3000 \
  -e NODE_ENV=production \
  blog-backend:local

# Build without using Docker layer cache (clean rebuild)
docker build --no-cache -t blog-backend:local .
```

The app container does not include PostgreSQL. In production you connect to an external database via `DATABASE_URL`. Locally, start Postgres with `docker compose up -d` first, then pass `DATABASE_URL` when running the app image (once Prisma is wired up in later steps).

### Troubleshooting

**Port 5432 already in use** — another Postgres instance (local install or another project) is bound to that port. Stop it, or add a `docker-compose.override.yml` (gitignored) to map a different host port, e.g. `5433:5432`, and update `DATABASE_URL` in `.env` accordingly.

**Connection refused** — the container may still be starting. Run `docker compose ps` and wait for `healthy`, or check logs with `docker compose logs postgres`.

**Wrong password / database does not exist** — ensure `.env` matches the credentials in `docker-compose.yml`. If you changed compose env vars after the volume was created, run `docker compose down -v` and start fresh.

**Reset local data** — `docker compose down -v` removes the volume and recreates empty `blog_dev` and `blog_test` databases on the next `up`.

## Environment variables

Copy [`.env.example`](./.env.example) to `.env` and adjust values for your machine. Never commit `.env` — it is gitignored.

| Variable            | Description                                               |
| ------------------- | --------------------------------------------------------- |
| `DATABASE_URL`      | PostgreSQL connection string for development (`blog_dev`) |
| `DATABASE_URL_TEST` | PostgreSQL connection string for e2e tests (`blog_test`) — never use for seed |
| `JWT_SECRET`        | Secret used to sign JWT access tokens                     |
| `JWT_EXPIRES_IN`    | Access token lifetime (e.g. `15m`)                        |
| `PORT`              | HTTP port the API listens on                              |
| `CORS_ORIGIN`       | Allowed frontend origin (e.g. Vite dev server)            |
| `API_PREFIX`        | URL path prefix for all routes (e.g. `v1`)                |
| `NODE_ENV`          | Runtime environment (`development`, `test`, `production`) |

## Scripts

```bash
npm run start:dev      # development with hot reload
npm run build          # compile TypeScript
npm run start:prod     # run compiled output

npm run lint           # ESLint (with auto-fix)
npm run lint:check     # ESLint (check only)
npm run format         # Prettier (write)
npm run format:check   # Prettier (check only)

npm run test           # unit tests
npm run test:e2e       # end-to-end tests
npm run test:cov       # unit tests with coverage

npm run db:generate    # regenerate Prisma Client from schema
npm run db:migrate     # create/apply migrations (dev)
npm run db:migrate:deploy  # apply migrations only (CI/production)
npm run db:migrate:test    # apply migrations to blog_test (e2e)
npm run db:seed            # seed blog_dev with sample data
npm run db:studio          # open Prisma Studio
```

## Git commits

[Husky](https://typicode.github.io/husky/) is a tool that wires **git hooks** into this project — small scripts Git runs automatically at certain points (for example, right before a commit is created). That lets the repo enforce checks locally so broken or poorly formatted code is caught before it lands in history, without relying on CI alone.

This repo uses Husky for two hooks:

- **pre-commit** — runs ESLint and Prettier on staged files via lint-staged
- **commit-msg** — validates the commit message format with [commitlint](https://commitlint.js.org/)

Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type: description
```

Common types include `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, and `ci`.

Examples:

```bash
git commit -m "chore: add node pin and quality gates"
git commit -m "feat: bootstrap nestjs application"
```

Messages without a type prefix (for example, `add quality gates`) will be rejected by the commit-msg hook.
