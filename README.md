# Looma · 露玛 — AI 商拍工作室

AI e-commerce photography studio. Implemented from the Claude Design handoff
bundle (`index.html` and its five views: 灵感 / 工作室 / 编辑器 / 视频 / 素材库).

## Tech stack

| Concern              | Choice                                            |
| -------------------- | ------------------------------------------------- |
| Language             | TypeScript everywhere                             |
| Frontend             | Vite + React 18                                   |
| Backend              | Node + Express                                    |
| Data storage         | PostgreSQL (`pg`)                                 |
| Workflow orchestration | Temporal (photoshoot batches)                   |
| LLM base library     | Vercel AI SDK (`ai` + `@ai-sdk/anthropic`)        |
| LLM observability    | Langfuse (every art-director call is traced)      |

## Layout

```
packages/shared      Domain contract shared by web + api (dependency-free)
apps/web             Vite + React frontend — the five Looma views
apps/api             API server, Temporal worker, PG data layer
infra (docker-compose.yml)   Local PostgreSQL + Temporal
```

### Backend module design (high cohesion, low coupling)

```
apps/api/src
  config.ts                  one validated source of env config
  db/                        PG pool + schema + repositories (pure persistence)
  llm/
    observability.ts         Langfuse tracing surface (vendor-isolated)
    artDirector.ts           Atelier — LLM calls via the Vercel AI SDK
  temporal/                  workflows + activities + client
  modules/
    projects/                project domain: service + routes
    studio/                  conversation domain: service + routes
  http/                      cross-cutting HTTP plumbing
  server.ts / worker.ts      process entry points
```

Each layer depends only inward: routes → services → repositories / llm /
temporal. Vendors (Postgres, Temporal, Langfuse, the AI SDK) are each wrapped
in a single module so they stay swappable.

## Running locally

```bash
npm install

# 1. infrastructure
docker compose up -d            # PostgreSQL + Temporal

# 2. config
cp .env.example .env            # add ANTHROPIC_API_KEY / LANGFUSE_* if available

# 3. database
npm run db:migrate              # apply schema + seed demo data

# 4. processes (separate terminals)
npm run dev:api                 # API server  :4000
npm run dev:worker              # Temporal worker
npm run dev:web                 # Vite dev server :5173
```

The app degrades gracefully without optional infra:

- **No `ANTHROPIC_API_KEY`** — the art director uses a deterministic local
  fallback, so the conversation still works.
- **No Langfuse keys** — tracing becomes a no-op.
- **Temporal unreachable** — generation batches render inline instead of via a
  workflow.

## How a Studio turn works

1. `POST /api/studio/:projectId/messages` persists the user message.
2. `artDirector.directShoot()` runs the full thread through the Vercel AI SDK;
   the call is traced in Langfuse.
3. If the director decides to generate, `studioService.openBatch()` creates a
   `generation_batches` row + N `shots`, then starts a Temporal
   `photoshootWorkflow`.
4. The worker renders each shot (`renderShot` activity) and writes results back
   to Postgres.
5. The Studio canvas polls `GET /api/projects/:id` and shows shots resolving.
