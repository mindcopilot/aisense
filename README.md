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

## Running locally — out of the box

```bash
npm install
npm run dev          # API :4000 + web :5173, both with hot reload
```

That's it. No Docker, no `.env`, no migration step:

- the database **auto-falls-back to an in-memory Postgres** (pg-mem) when no
  real PostgreSQL is reachable, and **auto-applies the schema + demo data** on
  startup;
- with **no `ANTHROPIC_API_KEY`** the art director uses a deterministic local
  fallback, so the conversation still works;
- with **no Langfuse keys** tracing becomes a no-op;
- with **Temporal unreachable** generation batches render inline instead of via
  a workflow.

Open http://localhost:5173 and go to 工作室 — send a message like
「生成 4 张回眸」 and watch shots resolve on the canvas.

### Full production-style setup

```bash
docker compose up -d            # real PostgreSQL + Temporal
cp .env.example .env            # optional: ANTHROPIC_API_KEY / LANGFUSE_*
npm run db:migrate              # provision the real database
npm run dev:all                 # API + Temporal worker + web
```

## Model configuration

All models are configured in one place — `apps/api/src/llm/models.ts`, fed by
`config.ts`:

| Role          | Env var           | Default                       |
| ------------- | ----------------- | ----------------------------- |
| Art director  | `LLM_CHAT_MODEL`  | `claude-sonnet-4-6`           |
| Fast utility  | `LLM_FAST_MODEL`  | `claude-haiku-4-5-20251001`   |
| Image render  | `LLM_IMAGE_MODEL` | `looma-director-v3` (simulated) |

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
