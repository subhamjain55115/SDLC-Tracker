# SDLC Tracker

A personal, single-user full-stack web app: upload a development-roadmap JSON, tick off sub-steps phase by phase, gate-locked so the next phase cannot start until the current one is fully complete. Works in any browser — desktop, Android, iOS (installable as a PWA).

## Two Modes

- **Build Mode** — guided 4-stage wizard: 12 brainstorm questions → plan → roadmap builder (15-phase template pre-loaded) → export `<name>-roadmap.json`
- **Track Mode** — upload the JSON, tick sub-steps, confirm the 4-item Phase Gate, unlock the next phase

## Quick Start

```bash
npm install
cp .env.example .env.local   # fill in the three values
npm run dev                  # http://localhost:3000
```

On first visit you are asked to create the single account. After that, registration is permanently closed.

Test it: upload `examples/SampleProject-roadmap.json` from the main page.

## Environment Variables (`.env.local`)

| Variable | What |
|---|---|
| `MONGODB_URI` | MongoDB connection string — local or Atlas (`mongodb+srv://...`) |
| `NEXTAUTH_SECRET` | Random 32-byte string — `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` in dev; the production URL on Vercel |

## Seeding the Admin User (alternative to first-visit setup)

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=yourpassword npm run seed
```

## Resetting a Forgotten Password

There is no public reset flow (single-user app). Delete the document in the `users` collection in MongoDB, then either visit `/login` (setup form reappears) or run the seed script again.

## Roadmap JSON Schema

Top level: `project`, `brainstorm`, `plan`, `phases[]`, `v2_backlog[]`, `decision_log[]`.
Each phase: `number`, `name`, `colour_tag`, `one_line_mission`, `status`, `done_criterion`, `tasks[]`, `phase_gate`.
Each task: `id`, `description`, `ce_driver`, `context_skills[]`, `sub_op_plugins[]`, `one_line_treatment`, `done`, `sub_steps[]`.
Each sub-step: `id`, `description`, `expected_output`, `done`.

Only `project.name` and a non-empty `phases` array are strictly required — everything else is normalized with defaults. See `examples/SampleProject-roadmap.json`.

Re-uploading a JSON with the same project name merges it with existing progress — completed items are never lost.

## Deploy (Vercel + MongoDB Atlas)

1. Create a free MongoDB Atlas cluster, create a DB user, allow access from anywhere (or Vercel IPs), copy the connection string.
2. Push this repo to GitHub.
3. Import the repo in Vercel. Set `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (the Vercel URL) as environment variables.
4. Deploy. Visit the URL, create the single account, done.

## API Routes

| Method | Route | Purpose |
|---|---|---|
| GET/POST | `/api/setup` | Check if first-run setup is needed / create the single user (403 after) |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth session handling |
| GET | `/api/projects` | Project list with progress summaries |
| POST | `/api/projects` | Upload roadmap JSON (creates or merges) |
| GET | `/api/projects/[id]` | Full project with tick state |
| PATCH | `/api/projects/[id]` | Actions: `tick_substep`, `tick_task`, `set_gate_item`, `confirm_gate`, `add_backlog`, `add_decision`, `set_notes` |
| DELETE | `/api/projects/[id]` | Remove a project |
