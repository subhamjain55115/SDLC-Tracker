# Development Roadmap — SDLC Tracker

---

## Project State

| Phase | Status | Completed | Notes |
|---|---|---|---|
| Phase -1  Inception | DONE | 2026-07-02 | Spec in SDLC-Tracker-App.md; CLAUDE.md and roadmap created |
| Phase 0   Discovery & ADRs | PENDING | — | ADR files not yet written (code built first at user request) |
| Phase 1   Environment Setup | IN PROGRESS | — | App scaffolded, builds clean, git repo committed; needs .env.local + first run |
| Phase 2   Data Layer | IN PROGRESS | — | Supabase migration SQL, validation, seed script written; needs live Supabase verification |
| Phase 3   Business Logic | IN PROGRESS | — | Tick engine, gate lock, merge, progress all implemented; unit tests not yet written |
| Phase 4   Auth & Middleware | IN PROGRESS | — | Supabase Auth + closed registration + middleware implemented; integration tests pending |
| Phase 5   Interface — Main Page & Track Mode | IN PROGRESS | — | All screens and API routes built; needs end-to-end verification with live DB |
| Phase 6   Interface — Build Mode | IN PROGRESS | — | 4-stage wizard with 12 brainstorm questions built; needs end-to-end verification |
| Phase 7   Security Audit | PENDING | — | — |
| Phase 8   Performance | PENDING | — | — |
| Phase 9   DevOps & Deployment | PENDING | — | — |
| Phase 10  Documentation & Release | PENDING | — | — |

---

## Phase Gate Checklist

Run before calling `PHASE DONE:` on any phase. All four must be true:

```
[ ] All tasks in the phase are complete
[ ] Done criterion is met — verified against the real system
[ ] /ce-code-review passed — no unresolved blockers
[ ] /ce-commit done — work is in git history
```

---

## Scope Lock

Any idea that surfaces mid-development but does not belong to the current phase → `docs/v2-backlog.md`. Current phase continues unchanged.

---

## Decision Log

All micro-decisions → `docs/decisions/log.md`. One row per decision, logged at the moment it is made.

---

## Test Strategy

Written at the start of Phase 3. Lives at `docs/test-strategy.md`.

---

## How to Read the Phase Tables

| Column | Meaning |
|---|---|
| Task | What is being done |
| CE Driver | Compound Engineering skill that orchestrates the task |
| Context Skills | Domain skills activated before CE Driver runs |
| Sub-op Plugins | Specific sub-task commands invoked during execution |

---

## Phase -1 — Project Inception

**Status:** DONE — 2026-07-02

---

### Brainstorm — 12 Questions Answered

| # | Question | Answer |
|---|---|---|
| 1 | Product name & tagline | SDLC Tracker — "Upload your roadmap JSON, tick off sub-steps, ship the product" |
| 2 | The problem | Mid-project, I lose track of which phase I am in, which tasks are done, and what the next step is. The roadmap lives in a markdown file and gets ignored within days of starting |
| 3 | Pain intensity | 8/10 — without a live tracker, fresh AI sessions re-derive state from context, causing drift and hallucination. Every session starts with "where were we?" |
| 4 | Evidence | Personal experience building ProductAnalyser — the roadmap existed but was not a live working tool. Phase status was mental, not tracked |
| 5 | The user | Solo developer (me) building AI-assisted projects. Uses Claude Code as the primary development tool. Works across multiple concurrent projects on a single machine |
| 6 | What they do today | Re-read the markdown roadmap file at the start of each session and try to remember which tasks are done. Gets stale within 2–3 sessions |
| 7 | Core insight | The roadmap and the development process are the same thing. If the roadmap is a live, gate-locked tracker — not a static document — the developer is forced to follow the process |
| 8 | Core loop | Developer uploads roadmap JSON → ticks sub-steps as they complete each task in the IDE → Phase Gate enforces no next phase until current is 100% done |
| 9 | V1 features | 1. Upload JSON → project appears in list. 2. Multi-project list on main page with progress bars. 3. Sub-step checkboxes. 4. Task auto-complete when all sub-steps ticked. 5. Phase Gate (locked until all tasks done). 6. Phase status: DONE / IN PROGRESS / PENDING / LOCKED. 7. Scope Lock panel (V2 backlog). 8. Decision Log panel. 9. Export progress JSON. 10. Single-user login |
| 10 | What this is NOT | Not a team tool. Not a project management platform. Not a Jira replacement. No time tracking. No Gantt charts. No AI inside the tracker itself. No public access |
| 11 | Non-negotiable rule | Phase Gate is hard-locked — the next phase cannot be opened until all 4 gate items are confirmed. No bypass. No override |
| 12 | Success metric | Upload a real roadmap JSON → tick all sub-steps of one phase → confirm Phase Gate → next phase unlocks. Verified on the live production URL, not localhost |

---

### CE Sequence Completed

```
/ce-strategy    → Product vision, success metrics captured
/ce-ideate      → Build Mode vs Track Mode explored and confirmed
/ce-brainstorm  → Full spec written → SDLC-Tracker-App.md
/ce-plan        → Tech stack, architecture, API routes, DB schema documented
```

### Bootstrap Completed

- `.claude/CLAUDE.md` written
- `docs/development-roadmap.md` (this file) written
- `docs/v2-backlog.md` created
- `docs/decisions/log.md` created

**Done criterion met:** All 12 brainstorm questions answered. Spec, CLAUDE.md, and roadmap all exist with real content.

---

## Phase 0 — Discovery & ADRs

**One-line mission:** Document every major technical decision as an ADR before writing a single line of application code.

| Task | CE Driver | Context Skills | Sub-op Plugins |
|---|---|---|---|
| Write ADR: Next.js 14 App Router over React+Vite | `/ce-work` | `nextjs-mastery` | `/adr-writer:write-adr` |
| Write ADR: Supabase Postgres (JSONB) over MongoDB | `/ce-work` | `database-optimization`, `postgres-optimization` | `/adr-writer:write-adr` |
| Write ADR: Supabase Auth over NextAuth.js for single-user auth | `/ce-work` | `security-hardening` | `/adr-writer:write-adr` |
| Write ADR: Vercel + Supabase over self-hosted Hetzner | `/ce-work` | — | `/adr-writer:write-adr` |
| Write ADR: Server-side state (Postgres) over client-side (localStorage) | `/ce-work` | — | `/adr-writer:write-adr` |
| Define MVP feature boundary — Build Mode vs Track Mode scope | `/ce-work` | — | `/discuss:discuss` |

**Done criterion:** Five ADR files exist in `docs/decisions/`. MVP scope is written and agreed.

---

## Phase 1 — Environment Setup

**One-line mission:** A fresh clone of the repo runs the app locally with one command.

| Task | CE Driver | Context Skills | Sub-op Plugins |
|---|---|---|---|
| Scaffold Next.js 14 App Router project | `/ce-work` | `nextjs-mastery` | `/project-scaffold:scaffold` |
| Install and configure Tailwind CSS | `/ce-work` | `frontend-excellence` | `/project-scaffold:add-feature` |
| Configure Supabase clients (`@supabase/ssr` server + browser) | `/ce-work` | `database-optimization` | `/env-manager:env-setup` |
| Set up Supabase Auth (email/password, session middleware) | `/ce-work` | `security-hardening` | `/project-scaffold:add-feature` |
| Create `.env.example` with all required keys | `/ce-work` | `security-hardening` | `/env-manager:env-setup` |
| Validate `.env` is in `.gitignore` | `/ce-work` | `security-hardening` | `/env-manager:env-validate` |
| Set up git with `main` as protected branch | `/ce-work` | `git-advanced` | `/git-flow:flow-start` |
| Verify: `npm run dev` serves app on localhost | Manual | — | — |

**Done criterion:** `npm run dev` starts without errors; app loads on `localhost:3000`; `.env.example` committed; `.env` gitignored.

---

## Phase 2 — Data Layer

**One-line mission:** Postgres schema defined with RLS; migration runs cleanly; seed works.

| Task | CE Driver | Context Skills | Sub-op Plugins |
|---|---|---|---|
| Design `projects` collection schema with full JSON roadmap embedded | `/ce-work` | `database-optimization` | `/schema-designer:design-schema` |
| Users handled by Supabase Auth (`auth.users`) — no custom table needed | `/ce-work` | `security-hardening` | — |
| Write migration SQL: `projects` table (JSONB roadmap, updated_at trigger, RLS policy) | `/ce-work` | `postgres-optimization` | `/migration-generator:create-migration` |
| Write JSON schema validator for uploaded roadmap files | `/ce-work` | `typescript-advanced` | — |
| Write seed script: create the one admin user | `/ce-work` | `security-hardening` | `/seed-generator:generate-seeds` |
| Write seed script: insert one example project from sample JSON | `/ce-work` | — | `/seed-generator:seed-db` |
| Verify seed runs cleanly and Supabase dashboard shows the rows | Manual | — | — |

**Done criterion:** Migration SQL runs without error in Supabase; `npm run seed` creates the admin user; `projects` table visible with RLS enabled.

---

## Phase 3 — Business Logic

**One-line mission:** All tick state, phase locking, and progress calculation logic is written and fully unit-tested before any UI depends on it.

**First task:** Write `docs/test-strategy.md`.

| Task | CE Driver | Context Skills | Sub-op Plugins |
|---|---|---|---|
| Write `docs/test-strategy.md` | `/ce-work` | `tdd-mastery`, `testing-strategies` | — |
| JSON upload handler: parse, validate schema, reject malformed files | `/ce-work` | `tdd-mastery` | `/test-writer:unit-test` |
| Tick state engine: sub-step tick → task completion rule | `/ce-work` | `tdd-mastery` | `/test-writer:unit-test` |
| Tick state engine: task completion → phase gate unlock rule | `/ce-work` | `tdd-mastery` | `/test-writer:unit-test` |
| Phase gate confirmation: all 4 items → phase DONE + date recorded + next phase unlocked | `/ce-work` | `tdd-mastery` | `/test-writer:unit-test` |
| Phase lock rule: phase status = LOCKED when previous phase is not DONE | `/ce-work` | `tdd-mastery` | `/test-writer:unit-test` |
| Progress calculator: % complete per phase and overall | `/ce-work` | `tdd-mastery` | `/test-writer:unit-test` |
| JSON merge on re-upload: new content + existing tick state merged, completed items preserved | `/ce-work` | `tdd-mastery` | `/test-writer:unit-test` |
| Project name extraction from JSON filename | `/ce-work` | `tdd-mastery` | `/test-writer:unit-test` |
| Run mutation testing on all business logic | `/ce-work` | `tdd-mastery` | `/mutation-tester:mutate` |

**Done criterion:** All unit tests pass; coverage on business logic above 80%; every edge case (empty phase, all locked, re-upload merge) has a test.

---

## Phase 4 — Auth & Middleware

**One-line mission:** Login works, session protects all routes, registration is permanently closed after first user.

| Task | CE Driver | Context Skills | Sub-op Plugins |
|---|---|---|---|
| Implement Supabase Auth sign-in with session cookies (`@supabase/ssr`) | `/ce-work` | `security-hardening`, `authentication-patterns` | — |
| Middleware: protect all routes except `/login` | `/ce-work` | `security-hardening` | — |
| Registration gate: if `users` collection has ≥ 1 document, return 403 on any sign-up attempt | `/ce-work` | `security-hardening` | — |
| Session: JWT in httpOnly cookie, 7-day expiry | `/ce-work` | `security-hardening` | — |
| Login page UI: email + password form, error state | `/ce-work` | `nextjs-mastery` | `/frontend-developer:create-component` |
| Test: valid login → redirects to main page | `/ce-work` | `testing-strategies` | `/test-writer:integration-test` |
| Test: invalid login → error message shown | `/ce-work` | `testing-strategies` | `/test-writer:integration-test` |
| Test: unauthenticated request to `/` → redirected to `/login` | `/ce-work` | `testing-strategies` | `/test-writer:integration-test` |
| Test: second sign-up attempt → 403 | `/ce-work` | `testing-strategies` | `/test-writer:integration-test` |

**Done criterion:** Login works with correct credentials; all protected routes redirect to `/login` when session missing; second registration attempt returns 403.

---

## Phase 5 — Interface: Main Page & Track Mode

**One-line mission:** The full Track Mode flow works end-to-end: upload JSON → see project list → open project → tick sub-steps → confirm phase gate → next phase unlocks.

| Task | CE Driver | Context Skills | Sub-op Plugins |
|---|---|---|---|
| Main page: project list with progress bars, + New Project button | `/ce-work` | `nextjs-mastery`, `react-patterns` | `/frontend-developer:create-component` |
| Upload dialog: file picker, JSON validation feedback, project name preview from filename | `/ce-work` | `nextjs-mastery` | `/frontend-developer:create-component` |
| API route: `POST /api/projects` — upload JSON, validate, store to Postgres | `/ce-work` | `nextjs-mastery` | `/backend-architect:add-endpoint` |
| API route: `GET /api/projects` — return list with progress summary | `/ce-work` | `nextjs-mastery` | `/backend-architect:add-endpoint` |
| API route: `GET /api/projects/[id]` — return full project with tick state | `/ce-work` | `nextjs-mastery` | `/backend-architect:add-endpoint` |
| API route: `PATCH /api/projects/[id]` — update tick state (sub-step, task, gate item) | `/ce-work` | `nextjs-mastery` | `/backend-architect:add-endpoint` |
| API route: `DELETE /api/projects/[id]` — remove project | `/ce-work` | `nextjs-mastery` | `/backend-architect:add-endpoint` |
| Track Mode: Project State table — all phases with status badges (DONE/IN PROGRESS/PENDING/LOCKED) | `/ce-work` | `react-patterns` | `/frontend-developer:create-component` |
| Track Mode: Phase detail — expand phase to see all tasks and sub-steps | `/ce-work` | `react-patterns` | `/frontend-developer:create-component` |
| Track Mode: Sub-step checkbox — tick → saves to Postgres → task auto-completes when all sub-steps ticked | `/ce-work` | `react-patterns` | `/frontend-developer:create-component` |
| Track Mode: Phase Gate — appears only when all tasks ticked; 4 checkboxes; Confirm button | `/ce-work` | `react-patterns` | `/frontend-developer:create-component` |
| Track Mode: Gate confirmation → phase DONE, date prompt, next phase unlocks | `/ce-work` | `react-patterns` | — |
| Track Mode: Scope Lock sidebar — V2 backlog list + add idea button | `/ce-work` | `react-patterns` | `/frontend-developer:create-component` |
| Track Mode: Decision Log sidebar — log entries + add decision button | `/ce-work` | `react-patterns` | `/frontend-developer:create-component` |
| Export progress JSON button | `/ce-work` | `react-patterns` | — |
| Test all API routes | `/ce-work` | `testing-strategies` | `/api-tester:test-endpoint` |

**Done criterion:** Upload a real roadmap JSON → project appears in list → open project → tick all sub-steps of one task → task auto-completes → tick all tasks of one phase → Phase Gate appears → confirm gate → phase shows DONE → next phase shows PENDING (unlocked).

---

## Phase 6 — Interface: Build Mode

**One-line mission:** Build Mode 4-stage form works end-to-end: fill in brainstorm → plan → roadmap → export valid JSON.

| Task | CE Driver | Context Skills | Sub-op Plugins |
|---|---|---|---|
| Build Mode layout: 4-step progress indicator, stage navigation | `/ce-work` | `nextjs-mastery`, `react-patterns` | `/frontend-developer:create-component` |
| Stage 1 — Brainstorm form: all fields (problem, insight, user, tagline, core principle, what this is not) | `/ce-work` | `react-patterns` | `/frontend-developer:create-component` |
| Stage 2 — Plan form: tech stack table (add/remove rows), key features list, V1 scope boundary, architecture overview | `/ce-work` | `react-patterns` | `/frontend-developer:create-component` |
| Stage 3 — Roadmap Builder: pre-loaded 15-phase template, each phase expandable with task form | `/ce-work` | `react-patterns` | `/frontend-developer:create-component` |
| Roadmap Builder: add/remove/reorder phases | `/ce-work` | `react-patterns` | — |
| Roadmap Builder: per-task fields — description, CE Driver, Context Skills (tag input), Plugins (tag input), one-line treatment | `/ce-work` | `react-patterns` | `/frontend-developer:create-component` |
| Roadmap Builder: per-task sub-steps — add sub-steps with description + expected output | `/ce-work` | `react-patterns` | `/frontend-developer:create-component` |
| Stage 4 — Preview: read-only summary of all phases; Export JSON button | `/ce-work` | `react-patterns` | `/frontend-developer:create-component` |
| JSON export: generate valid roadmap.json matching the defined schema, trigger browser download | `/ce-work` | `typescript-advanced` | — |
| Validate exported JSON matches schema before download | `/ce-work` | `typescript-advanced` | — |

**Done criterion:** Complete all 4 Build Mode stages with real content → click Export → download `<project-name>-roadmap.json` → upload it to Track Mode → project appears correctly with all phases, tasks, and sub-steps.

---

## Phase 7 — Security Audit

**One-line mission:** Zero critical, zero high open findings.

| Task | CE Driver | Context Skills | Sub-op Plugins |
|---|---|---|---|
| OWASP audit of all API routes | `/ce-code-review` | `security-hardening` | `/security-guidance:security-check` |
| Verify registration gate cannot be bypassed | `/ce-code-review` | `security-hardening` | `/code-guardian:security-scan` |
| Check for secrets in committed files | `/ce-code-review` | `security-hardening` | `/code-guardian:security-scan` |
| Dependency vulnerability audit | `/ce-work` | `security-hardening` | `/dependency-manager:audit-deps` |
| Validate httpOnly cookie and SameSite settings | `/ce-work` | `security-hardening` | — |
| Validate all user input (JSON upload, form fields) is rejected at boundary | `/ce-work` | `security-hardening` | `/security-guidance:fix-vulnerability` |

**Done criterion:** `npm audit` shows zero critical/high; OWASP checklist has no open items; registration gate tested and confirmed closed.

---

## Phase 8 — Performance

**One-line mission:** Page loads fast and large roadmap JSONs (50+ phases) parse and render without lag.

| Task | CE Driver | Context Skills | Sub-op Plugins |
|---|---|---|---|
| Profile main page load with 20 projects | `/ce-optimize` | `performance-optimization` | `/perf-profiler:profile` |
| Profile Track Mode render with a 15-phase roadmap | `/ce-optimize` | `performance-optimization` | `/perf-profiler:profile` |
| Analyse and reduce JS bundle size | `/ce-optimize` | `performance-optimization` | `/bundle-analyzer:analyze-bundle` |
| Lighthouse audit on main page and Track Mode | `/ce-work` | `performance-optimization` | `/lighthouse-runner:run-audit` |
| Fix any issues > threshold | `/ce-optimize` | `performance-optimization` | `/optimize:optimize-perf` |

**Done criterion:** Lighthouse performance score ≥ 90 on main page; Track Mode renders a 15-phase roadmap in under 500ms on a standard connection.

---

## Phase 9 — DevOps & Deployment

**One-line mission:** One git push to main deploys the app automatically; live URL works.

| Task | CE Driver | Context Skills | Sub-op Plugins |
|---|---|---|---|
| Create Vercel project and connect to GitHub repo | `/ce-work` | — | — |
| Configure environment variables on Vercel (Supabase URL, anon key, service role key) | `/ce-work` | `security-hardening` | `/env-manager:env-setup` |
| Create Supabase project, run migration SQL, disable public sign-ups | `/ce-work` | `database-optimization` | — |
| Configure CI: lint + type-check + unit tests on every push | `/ce-work` | `ci-cd-pipelines` | `/deploy-pilot:ci-pipeline` |
| Verify: push to `main` → Vercel auto-deploys → live URL serves app | Manual | — | — |
| Run seed script against production Supabase to create the admin user | `/ce-work` | `security-hardening` | — |
| Verify login works on production URL | Manual | — | — |

**Done criterion:** Production URL loads; login works; upload a JSON; project appears in list — all on the live deployment, not localhost.

---

## Phase 10 — Documentation & Release

**One-line mission:** README has everything needed to clone, configure, and deploy from scratch.

| Task | CE Driver | Context Skills | Sub-op Plugins |
|---|---|---|---|
| Write README: what the app is, install steps, env vars, seed command, deploy | `/ce-work` | — | `/readme-generator:generate-readme` |
| Document JSON schema in README | `/ce-work` | — | — |
| Document how to reset the admin user password | `/ce-work` | `security-hardening` | — |
| Tag `v1.0.0` | `/ce-work` | — | `/release-manager:release` |

**Done criterion:** Clone repo → follow README → app is running locally in under 10 minutes; `v1.0.0` tag exists on `main`.

---

## Quick Reference

| Phase | Name | Status |
|---|---|---|
| -1 | Project Inception | ✅ DONE |
| 0 | Discovery & ADRs | ⏳ PENDING |
| 1 | Environment Setup | ⏳ PENDING |
| 2 | Data Layer | ⏳ PENDING |
| 3 | Business Logic | ⏳ PENDING |
| 4 | Auth & Middleware | ⏳ PENDING |
| 5 | Interface: Main Page & Track Mode | ⏳ PENDING |
| 6 | Interface: Build Mode | ⏳ PENDING |
| 7 | Security Audit | ⏳ PENDING |
| 8 | Performance | ⏳ PENDING |
| 9 | DevOps & Deployment | ⏳ PENDING |
| 10 | Documentation & Release | ⏳ PENDING |

---

## Standard Command Sequence (Every Phase)

```
PHASE: [name]
GOAL:  [one sentence]
DONE WHEN: [verifiable criterion]

/ce-work          → execute tasks
/ce-code-review   → review
/ce-commit        → commit
```
