import { defaultPhaseTemplate } from "./template";
import type { Phase, Roadmap } from "./types";

export interface Draft {
  project: Roadmap["project"];
  brainstorm: Roadmap["brainstorm"];
  plan: Roadmap["plan"];
  phases: Phase[];
}

export function emptyDraft(): Draft {
  return {
    project: {
      name: "",
      description: "",
      tagline: "",
      core_principle: "",
      v1_scope_boundary: "",
      tech_stack: [],
      architecture_overview: "",
      success_metric_v1: "",
    },
    brainstorm: {
      problem: "",
      pain_intensity: "",
      evidence: "",
      user: "",
      current_alternative: "",
      insight: "",
      core_loop: "",
      what_this_is_not: "",
    },
    plan: {
      key_features_v1: [],
      key_constraints: [],
    },
    phases: defaultPhaseTemplate(),
  };
}

export function draftToRoadmap(draft: Draft): Roadmap {
  return {
    project: { ...draft.project, description: draft.project.description || draft.project.tagline },
    brainstorm: draft.brainstorm,
    plan: draft.plan,
    phases: draft.phases,
    v2_backlog: [],
    decision_log: [],
  };
}

export const DRAFT_STORAGE_KEY = "sdlc-tracker-build-draft";
