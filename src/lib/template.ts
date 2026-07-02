import type { Phase } from "./types";

function makePhase(
  number: number,
  name: string,
  colour_tag: string,
  one_line_mission: string
): Phase {
  return {
    number,
    name,
    colour_tag,
    one_line_mission,
    status: "PENDING",
    completed_date: null,
    notes: "",
    done_criterion: "",
    tasks: [],
    phase_gate: {
      tasks_complete: false,
      done_criterion_met: false,
      code_review_passed: false,
      commit_done: false,
      confirmed_at: null,
    },
  };
}

export function defaultPhaseTemplate(): Phase[] {
  return [
    makePhase(-1, "Project Inception", "inception", "Define the product vision, brainstorm, write the plan, and bootstrap the project structure"),
    makePhase(1, "Architecture Decision Records", "architecture", "Document and commit the key technology choices before writing any production code"),
    makePhase(2, "Environment & Repository Setup", "devops", "Create the runnable skeleton — app boots, server starts, git branching strategy in place"),
    makePhase(3, "Database Schema & Migrations", "backend", "Design and migrate the schema; migrate up and down must both work cleanly"),
    makePhase(4, "Backend API: Core Endpoints", "backend", "Build and test the core endpoints with caching, validation, and rate limiting"),
    makePhase(5, "AI / External Service Integration", "backend", "Wire external services with fallbacks so failures are handled and results cached"),
    makePhase(6, "Local Data Assets", "backend", "Build any bundled static data assets with full lookup coverage"),
    makePhase(7, "Core Business Logic (fully tested)", "testing", "Implement and exhaustively unit-test the core logic before any UI depends on it"),
    makePhase(8, "Frontend / Mobile UI: Core Screens", "frontend", "Build the core screens wired to the real backend"),
    makePhase(9, "Integrations (Translation, Auth, etc.)", "frontend", "Add cross-cutting integrations across all content"),
    makePhase(10, "User-Generated Content / Reporting", "frontend", "Build the user reporting and feedback flows"),
    makePhase(11, "Performance & Device Testing", "testing", "Hit performance targets on the real target device and network conditions"),
    makePhase(12, "Security Audit", "security", "Zero critical and zero high findings — binaries clean, git history clean, OWASP checked"),
    makePhase(13, "DevOps & Production Deployment", "devops", "Live server with HTTPS, CI/CD pipeline, and monitoring — real URL returns real data"),
    makePhase(14, "Release (v1.0)", "release", "Signed build live, installs and runs on a fresh device"),
  ];
}
