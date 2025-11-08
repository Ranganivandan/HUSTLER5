# WorkZen Backend (Express + TypeScript)

Modern, modular Express.js backend using TypeScript, Prisma (Postgres), pg-boss (Postgres-backed queue), JWT auth, and production-minded defaults.

## Stack

- Express + TypeScript
- Prisma ORM (Postgres)
- pg-boss (job queue) – no Redis required
- JWT auth (access + refresh), bcrypt
- Cloudinary (uploads)
- Jest (unit/integration)
- ESLint + Prettier + Husky
- Docker + docker-compose (Postgres)

## Project Structure

```
backend/
  src/
    config/
      index.ts                 # env loader + zod validation
    controllers/
      health.controller.ts
    middlewares/
      error.middleware.ts
      auth.middleware.ts
      validation.middleware.ts
      request-logger.middleware.ts
    routes/
      index.ts                 # mounts /v1
      auth.routes.ts
    services/
      prisma.service.ts
      jwt.service.ts
      cloudinary.service.ts
      mailer.service.ts        # stub
      logger.service.ts        # winston
    repositories/
      user.repository.ts
    utils/
      types.ts
      constants.ts
    jobs/
      worker.ts                # pg-boss worker entry
    tests/
    app.ts
    server.ts
  prisma/
    schema.prisma
    seed.ts
  package.json
  tsconfig.json
  .eslintrc.js
  .prettierrc
  .env.example
```

## Quick Start (pnpm)

```bash
# 1) Install deps
pnpm install

# 2) Copy env
cp .env.example .env
# or on Windows PowerShell: Copy-Item .env.example .env

# 3) Start Postgres (optional: via docker)
docker compose up -d db

# 4) Generate client and run migrations
pnpm prisma:generate
pnpm migrate

# 5) Seed demo users
pnpm seed

# 6) Start API (dev)
pnpm dev
# Server: http://localhost:4000

# 7) Start worker (separate terminal)
pnpm worker:start
```

## Health Check

- `GET /v1/health` returns status of:
  - Database connectivity
  - Cloudinary credentials (usage ping)
  - pg-boss worker presence

Note: queue status will be degraded until the worker process is started (`pnpm worker:start`).

## Scripts

- `pnpm start` – start built server
- `pnpm start:dev` / `pnpm dev` – start in dev (ts-node-dev)
- `pnpm build` – transpile to `dist/`
- `pnpm lint` – ESLint
- `pnpm test` – Jest
- `pnpm migrate` – `prisma migrate dev`
- `pnpm prisma:generate` – generate Prisma client
- `pnpm prisma:deploy` – deploy migrations in prod
- `pnpm prisma:studio` – open Prisma Studio
- `pnpm seed` – run seed script
- `pnpm worker:start` – start pg-boss worker

## Docker (API + DB)

```bash
# from backend/
docker compose up --build
```

The compose will bring up Postgres and the API on port 4000. The worker can be started separately (or baked into another service if desired).

## Testing

```bash
pnpm test
```

## Husky

Husky is configured via `prepare` script. After install, create the hook if not present:

```bash
npx husky add .husky/pre-commit "pnpm lint && pnpm test"
```

This project is ready for further modules (employees, attendance, leaves, payroll). Add Prisma models and routes under `src/` consistently.
