# Decision Log — SDLC Tracker

Implementation decisions too small for an ADR but too important to re-derive each session.

| Date | Decision | Reason | Phase |
|---|---|---|---|
| 2026-07-02 | Supabase (Postgres + Auth + RLS) over MongoDB Atlas + NextAuth | Real Postgres, built-in auth removes custom users table + bcrypt code, RLS tenant isolation, 500 MB DB + 1 GB storage free tier | Phase 2 |
| 2026-07-02 | Roadmap stored as single JSONB column, one row per project | Document flexibility with real SQL underneath; no joins needed for V1 | Phase 2 |
| 2026-07-02 | Stay on Next 14.2.35 instead of upgrading to Next 15/16 | Critical middleware-bypass CVE patched in 14.2.25+; remaining audit highs are DoS/cache issues fixed only in 16 (breaking async cookies/params API); single-user app on Vercel — deferred to backlog | Phase 1 |
| 2026-07-02 | Single-user gate enforced at both app layer (/api/setup 403) and Supabase dashboard (sign-ups disabled) | Defence in depth — anon key could otherwise call auth.signUp directly | Phase 4 |
