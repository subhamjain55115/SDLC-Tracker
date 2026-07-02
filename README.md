# SDLC Tracker

A personal, single-user full-stack web app: upload a development-roadmap JSON, tick off sub-steps phase by phase, gate-locked so the next phase cannot start until the current one is fully complete. Works in any browser — desktop, Android, iOS (installable as a PWA).

## Two Modes

- **Build Mode** — guided 4-stage wizard: 12 brainstorm questions → plan → roadmap builder (15-phase template pre-loaded) → export `<name>-roadmap.json`
- **Track Mode** — upload the JSON, tick sub-steps, confirm the 4-item Phase Gate, unlock the next phase

## Stack

Next.js 14 App Router · Supabase (Postgres + Auth + RLS) · Tailwind CSS · SWR

## Quick Start

1. Create a free project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/0001_init.sql` in the SQL Editor (Dashboard → SQL Editor → paste → Run)
3. In **Authentication → Sign In / Up**, disable "Allow new users to sign up" (the app enforces single-user at the API layer too, but this closes the Supabase-level door)
4. Copy the three keys from **Project Settings → API** into `.env.local`:

```bash
npm install
cp .env.example .env.local   # fill in URL, anon key, service role key
npm run dev                  # http://localhost:3000
```

On first visit you are asked to create the single account. After that, registration is permanently closed.

Test it: upload `examples/SampleProject-roadmap.json` from the main page.

## Environment Variables (`.env.local`)

| Variable | What |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL — Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key — safe for the browser, RLS enforces access |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for one-time account setup and seeding. Never exposed to the browser |

## Seeding the Admin User (alternative to first-visit setup)

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=yourpassword npm run seed
```

## Resetting a Forgotten Password

Supabase Dashboard → Authentication → Users → select the user → Reset password (or delete the user and re-run setup).

## Roadmap JSON Schema

Top level: `project`, `brainstorm`, `plan`, `phases[]`, `v2_backlog[]`, `decision_log[]`.
Each phase: `number`, `name`, `colour_tag`, `one_line_mission`, `status`, `done_criterion`, `tasks[]`, `phase_gate`.
Each task: `id`, `description`, `ce_driver`, `context_skills[]`, `sub_op_plugins[]`, `one_line_treatment`, `done`, `sub_steps[]`.
Each sub-step: `id`, `description`, `expected_output`, `done`.

Only `project.name` and a non-empty `phases` array are strictly required — everything else is normalized with defaults. See `examples/SampleProject-roadmap.json`.

Re-uploading a JSON with the same project name merges it with existing progress — completed items are never lost.

## Deploy (Vercel + Supabase)

1. Push this repo to GitHub.
2. Import the repo in Vercel. Set the same three environment variables.
3. Deploy. Visit the URL, create the single account (or run the seed script), done.

## API Routes

| Method | Route | Purpose |
|---|---|---|
| GET/POST | `/api/setup` | Check if first-run setup is needed / create the single user (403 after) |
| GET | `/api/projects` | Project list with progress summaries |
| POST | `/api/projects` | Upload roadmap JSON (creates or merges) |
| GET | `/api/projects/[id]` | Full project with tick state |
| PATCH | `/api/projects/[id]` | Actions: `tick_substep`, `tick_task`, `set_gate_item`, `confirm_gate`, `add_backlog`, `add_decision`, `set_notes` |
| DELETE | `/api/projects/[id]` | Remove a project |

Authentication is session-cookie based via Supabase Auth (`@supabase/ssr`); the middleware refreshes tokens and redirects unauthenticated page requests to `/login`.

## Database

One table: `projects` — `id uuid`, `name text unique`, `roadmap jsonb`, timestamps with an auto-update trigger. The entire roadmap (with tick state) lives in the `roadmap` JSONB column. Row Level Security is enabled; only authenticated users can access rows.
