export type PhaseStatus = "PENDING" | "IN PROGRESS" | "DONE";
export type DerivedStatus = PhaseStatus | "LOCKED";

export interface SubStep {
  id: string;
  description: string;
  expected_output: string;
  done: boolean;
}

export interface RoadmapTask {
  id: number;
  description: string;
  ce_driver: string;
  context_skills: string[];
  sub_op_plugins: string[];
  one_line_treatment: string;
  done: boolean;
  sub_steps: SubStep[];
}

export interface PhaseGate {
  tasks_complete: boolean;
  done_criterion_met: boolean;
  code_review_passed: boolean;
  commit_done: boolean;
  confirmed_at: string | null;
}

export interface Phase {
  number: number;
  name: string;
  colour_tag: string;
  one_line_mission: string;
  status: PhaseStatus;
  completed_date: string | null;
  notes: string;
  done_criterion: string;
  tasks: RoadmapTask[];
  phase_gate: PhaseGate;
}

export interface TechStackEntry {
  layer: string;
  choice: string;
  why: string;
}

export interface Brainstorm {
  problem: string;
  pain_intensity: string;
  evidence: string;
  user: string;
  current_alternative: string;
  insight: string;
  core_loop: string;
  what_this_is_not: string;
}

export interface RoadmapProject {
  name: string;
  description: string;
  tagline: string;
  core_principle: string;
  v1_scope_boundary: string;
  tech_stack: TechStackEntry[];
  architecture_overview: string;
  success_metric_v1: string;
}

export interface BacklogItem {
  date: string;
  idea: string;
  why_deferred: string;
}

export interface DecisionEntry {
  date: string;
  decision: string;
  reason: string;
  phase: string;
}

export interface Roadmap {
  project: RoadmapProject;
  brainstorm: Brainstorm;
  plan: {
    key_features_v1: string[];
    key_constraints: string[];
  };
  phases: Phase[];
  v2_backlog: BacklogItem[];
  decision_log: DecisionEntry[];
}

export interface ProjectSummary {
  id: string;
  name: string;
  tagline: string;
  totalPhases: number;
  donePhases: number;
  totalSubSteps: number;
  doneSubSteps: number;
  percent: number;
  currentPhase: string;
  lastUpdated: string;
}

export const COLOUR_TAGS = [
  "inception",
  "architecture",
  "backend",
  "frontend",
  "testing",
  "devops",
  "release",
  "security",
] as const;

export const CE_DRIVERS = [
  "/ce-work",
  "/ce-optimize",
  "/ce-debug",
  "/ce-code-review",
  "/ce-commit",
  "/ce-simplify-code",
  "/ce-strategy",
  "/ce-ideate",
  "/ce-brainstorm",
  "/ce-plan",
  "/lfg",
] as const;
