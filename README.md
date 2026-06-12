# blog-backend

Portfolio project — backend API for a blog site. Built with [NestJS](https://nestjs.com/) and TypeScript. The frontend lives in a separate repo and consumes this service via a documented HTTP contract (OpenAPI).

See [project-plan.md](./project-plan.md) for the full roadmap.

## Prerequisites

- [Node.js](https://nodejs.org/) 24 (`nvm use` reads `.nvmrc`)
- [Docker](https://www.docker.com/) (for local PostgreSQL — added in Phase 2)

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

# 4. Start PostgreSQL (Phase 2 — docker-compose.yml)
docker compose up -d

# 5. Run database migrations (Phase 2 — Prisma)
npx prisma migrate dev

# 6. Seed development data (Phase 2 — Prisma)
npx prisma db seed

# 7. Start the API in watch mode
npm run start:dev
```

The API listens on `http://localhost:3000` by default (`PORT` in `.env`).

Steps 4–6 require [Phase 2: Database Layer & Containerization](./project-plan.md#phase-2-database-layer--containerization). Until then, skip straight to step 7 to run the NestJS shell.

## Environment variables

Copy [`.env.example`](./.env.example) to `.env` and adjust values for your machine. Never commit `.env` — it is gitignored.

| Variable            | Description                                               |
| ------------------- | --------------------------------------------------------- |
| `DATABASE_URL`      | PostgreSQL connection string for development              |
| `DATABASE_URL_TEST` | PostgreSQL connection string for e2e tests                |
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
