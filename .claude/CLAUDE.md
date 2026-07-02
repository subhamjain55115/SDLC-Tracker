# SDLC Tracker — Project Instructions

A personal full-stack web app: upload a roadmap JSON, tick off sub-steps phase by phase, gate-locked so you cannot move to the next phase until the current one is fully complete. Supports multiple concurrent projects.

## Two Modes
- **Build Mode** — guided 4-stage form: brainstorm → plan → roadmap builder → export JSON
- **Track Mode** — upload JSON, tick sub-steps and tasks, confirm Phase Gate, unlock next phase

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 App Router |
| Database | MongoDB (Atlas free tier) |
| Auth | NextAuth.js — credentials provider, single user, closed registration |
| Styling | Tailwind CSS |
| State | React Server Components + SWR for tick state |
| File Upload | Next.js API route + multer |
| Deployment | Vercel + MongoDB Atlas |

## Key Constraints
- Single user only — after first sign-up, registration is permanently closed
- All project state stored in MongoDB — not localStorage (persists across devices)
- JSON filename becomes the project name in the project list
- Re-uploading the same JSON merges with existing tick state — never overwrites completed items
- Phase Gate is hard-locked — next phase cannot be opened until all 4 gate items are confirmed

## Core Data Rule
One MongoDB document per project. The entire roadmap JSON (with tick state merged) is stored as a single embedded document in the `projects` collection. No joins.

## Full Spec
`C:\Users\LENOVO\Desktop\SDLC-Tracker-App.md`
Full roadmap: `docs/development-roadmap.md`
