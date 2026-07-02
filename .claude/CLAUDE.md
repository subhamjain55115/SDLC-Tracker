# SDLC Tracker — Project Instructions

A personal full-stack web app: upload a roadmap JSON, tick off sub-steps phase by phase, gate-locked so you cannot move to the next phase until the current one is fully complete. Supports multiple concurrent projects.

## Two Modes
- **Build Mode** — guided 4-stage form: 12 brainstorm questions → plan → roadmap builder → export JSON
- **Track Mode** — upload JSON, tick sub-steps and tasks, confirm Phase Gate, unlock next phase

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 App Router |
| Database | Supabase Postgres (roadmap stored as JSONB) |
| Auth | Supabase Auth — email/password, single user, closed registration |
| Sessions | `@supabase/ssr` cookie-based, refreshed in middleware |
| Styling | Tailwind CSS |
| Client state | SWR for tick-state updates |
| Deployment | Vercel + Supabase free tier |

## Key Constraints
- Single user only — first account created via `/api/setup` (service role); after that the endpoint returns 403. Public sign-ups also disabled in Supabase Auth settings
- All project state stored in Supabase Postgres — persists across devices
- `SUPABASE_SERVICE_ROLE_KEY` is server-only — never sent to the browser
- JSON filename becomes the project name in the project list
- Re-uploading the same JSON merges with existing tick state — never overwrites completed items
- Phase Gate is hard-locked — next phase cannot be opened until all 4 gate items are confirmed; enforced server-side in `src/lib/roadmap-actions.ts`

## Core Data Rule
One row per project in the `projects` table. The entire roadmap JSON (with tick state merged) is stored in a single JSONB column. RLS enabled — authenticated users only. Schema: `supabase/migrations/0001_init.sql`.

## Full Spec
`C:\Users\LENOVO\Desktop\SDLC-Tracker-App.md`
Full roadmap: `docs/development-roadmap.md`
