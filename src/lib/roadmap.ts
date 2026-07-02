import type {
  DerivedStatus,
  Phase,
  PhaseGate,
  Roadmap,
  RoadmapTask,
  SubStep,
} from "./types";

export function taskIsDone(task: RoadmapTask): boolean {
  if (task.sub_steps.length === 0) return task.done;
  return task.sub_steps.every((s) => s.done);
}

export function phaseTasksComplete(phase: Phase): boolean {
  return phase.tasks.length > 0 && phase.tasks.every(taskIsDone);
}

export function phaseHasProgress(phase: Phase): boolean {
  return phase.tasks.some(
    (t) => t.done || t.sub_steps.some((s) => s.done)
  );
}

export function gateConfirmed(gate: PhaseGate): boolean {
  return (
    gate.tasks_complete &&
    gate.done_criterion_met &&
    gate.code_review_passed &&
    gate.commit_done &&
    gate.confirmed_at !== null
  );
}

export function deriveStatuses(phases: Phase[]): DerivedStatus[] {
  const statuses: DerivedStatus[] = [];
  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    if (phase.status === "DONE" && gateConfirmed(phase.phase_gate)) {
      statuses.push("DONE");
      continue;
    }
    const unlocked = i === 0 || statuses[i - 1] === "DONE";
    if (!unlocked) {
      statuses.push("LOCKED");
    } else if (phaseHasProgress(phase)) {
      statuses.push("IN PROGRESS");
    } else {
      statuses.push("PENDING");
    }
  }
  return statuses;
}

export interface ProgressCounts {
  totalUnits: number;
  doneUnits: number;
  percent: number;
}

export function phaseProgress(phase: Phase): ProgressCounts {
  let total = 0;
  let done = 0;
  for (const task of phase.tasks) {
    if (task.sub_steps.length === 0) {
      total += 1;
      if (task.done) done += 1;
    } else {
      total += task.sub_steps.length;
      done += task.sub_steps.filter((s) => s.done).length;
    }
  }
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { totalUnits: total, doneUnits: done, percent };
}

export function roadmapProgress(roadmap: Roadmap): ProgressCounts {
  let total = 0;
  let done = 0;
  for (const phase of roadmap.phases) {
    const p = phaseProgress(phase);
    total += p.totalUnits;
    done += p.doneUnits;
  }
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { totalUnits: total, doneUnits: done, percent };
}

export function currentPhaseName(roadmap: Roadmap): string {
  const statuses = deriveStatuses(roadmap.phases);
  const idx = statuses.findIndex((s) => s === "IN PROGRESS" || s === "PENDING");
  if (idx === -1) return "All phases complete";
  const phase = roadmap.phases[idx];
  return `Phase ${phase.number} — ${phase.name}`;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizeSubStep(raw: unknown, index: number, taskId: number): SubStep {
  const s = (raw ?? {}) as Record<string, unknown>;
  return {
    id: asString(s.id, `${taskId}${String.fromCharCode(97 + index)}`),
    description: asString(s.description),
    expected_output: asString(s.expected_output),
    done: s.done === true,
  };
}

function normalizeTask(raw: unknown, index: number): RoadmapTask {
  const t = (raw ?? {}) as Record<string, unknown>;
  const id = typeof t.id === "number" ? t.id : index + 1;
  return {
    id,
    description: asString(t.description),
    ce_driver: asString(t.ce_driver),
    context_skills: asArray(t.context_skills).map((v) => asString(v)),
    sub_op_plugins: asArray(t.sub_op_plugins).map((v) => asString(v)),
    one_line_treatment: asString(t.one_line_treatment),
    done: t.done === true,
    sub_steps: asArray(t.sub_steps).map((s, i) => normalizeSubStep(s, i, id)),
  };
}

function normalizeGate(raw: unknown): PhaseGate {
  const g = (raw ?? {}) as Record<string, unknown>;
  return {
    tasks_complete: g.tasks_complete === true,
    done_criterion_met: g.done_criterion_met === true,
    code_review_passed: g.code_review_passed === true,
    commit_done: g.commit_done === true,
    confirmed_at: typeof g.confirmed_at === "string" ? g.confirmed_at : null,
  };
}

function normalizePhase(raw: unknown, index: number): Phase {
  const p = (raw ?? {}) as Record<string, unknown>;
  const status = p.status === "DONE" || p.status === "IN PROGRESS" ? p.status : "PENDING";
  return {
    number: typeof p.number === "number" ? p.number : index,
    name: asString(p.name, `Phase ${index}`),
    colour_tag: asString(p.colour_tag, "backend"),
    one_line_mission: asString(p.one_line_mission),
    status,
    completed_date: typeof p.completed_date === "string" ? p.completed_date : null,
    notes: asString(p.notes),
    done_criterion: asString(p.done_criterion),
    tasks: asArray(p.tasks).map(normalizeTask),
    phase_gate: normalizeGate(p.phase_gate),
  };
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  roadmap: Roadmap | null;
}

export function validateAndNormalize(data: unknown): ValidationResult {
  const errors: string[] = [];
  if (typeof data !== "object" || data === null) {
    return { ok: false, errors: ["File is not a JSON object"], roadmap: null };
  }
  const d = data as Record<string, unknown>;
  const project = (d.project ?? {}) as Record<string, unknown>;
  if (!asString(project.name)) errors.push("project.name is required");
  if (!Array.isArray(d.phases) || d.phases.length === 0) {
    errors.push("phases must be a non-empty array");
  }
  if (errors.length > 0) return { ok: false, errors, roadmap: null };

  const brainstorm = (d.brainstorm ?? {}) as Record<string, unknown>;
  const plan = (d.plan ?? {}) as Record<string, unknown>;

  const roadmap: Roadmap = {
    project: {
      name: asString(project.name),
      description: asString(project.description),
      tagline: asString(project.tagline),
      core_principle: asString(project.core_principle),
      v1_scope_boundary: asString(project.v1_scope_boundary),
      tech_stack: asArray(project.tech_stack).map((row) => {
        const r = (row ?? {}) as Record<string, unknown>;
        return { layer: asString(r.layer), choice: asString(r.choice), why: asString(r.why) };
      }),
      architecture_overview: asString(project.architecture_overview),
      success_metric_v1: asString(project.success_metric_v1),
    },
    brainstorm: {
      problem: asString(brainstorm.problem),
      pain_intensity: asString(brainstorm.pain_intensity),
      evidence: asString(brainstorm.evidence),
      user: asString(brainstorm.user),
      current_alternative: asString(brainstorm.current_alternative),
      insight: asString(brainstorm.insight),
      core_loop: asString(brainstorm.core_loop),
      what_this_is_not: asString(brainstorm.what_this_is_not),
    },
    plan: {
      key_features_v1: asArray(plan.key_features_v1).map((v) => asString(v)),
      key_constraints: asArray(plan.key_constraints).map((v) => asString(v)),
    },
    phases: asArray(d.phases).map(normalizePhase),
    v2_backlog: asArray(d.v2_backlog).map((row) => {
      const r = (row ?? {}) as Record<string, unknown>;
      return {
        date: asString(r.date),
        idea: asString(r.idea),
        why_deferred: asString(r.why_deferred),
      };
    }),
    decision_log: asArray(d.decision_log).map((row) => {
      const r = (row ?? {}) as Record<string, unknown>;
      return {
        date: asString(r.date),
        decision: asString(r.decision),
        reason: asString(r.reason),
        phase: asString(r.phase),
      };
    }),
  };
  return { ok: true, errors: [], roadmap };
}

export function mergeRoadmaps(existing: Roadmap, incoming: Roadmap): Roadmap {
  const merged: Roadmap = { ...incoming };
  merged.phases = incoming.phases.map((phase) => {
    const old = existing.phases.find((p) => p.number === phase.number);
    if (!old) return phase;
    const tasks = phase.tasks.map((task) => {
      const oldTask = old.tasks.find((t) => t.id === task.id);
      if (!oldTask) return task;
      return {
        ...task,
        done: task.done || oldTask.done,
        sub_steps: task.sub_steps.map((step) => {
          const oldStep = oldTask.sub_steps.find((s) => s.id === step.id);
          return oldStep ? { ...step, done: step.done || oldStep.done } : step;
        }),
      };
    });
    return {
      ...phase,
      status: old.status === "DONE" ? old.status : phase.status,
      completed_date: old.completed_date ?? phase.completed_date,
      notes: old.notes || phase.notes,
      tasks,
      phase_gate: gateConfirmed(old.phase_gate) ? old.phase_gate : phase.phase_gate,
    };
  });
  merged.v2_backlog = [...existing.v2_backlog];
  for (const item of incoming.v2_backlog) {
    if (!merged.v2_backlog.some((b) => b.idea === item.idea)) {
      merged.v2_backlog.push(item);
    }
  }
  merged.decision_log = [...existing.decision_log];
  for (const entry of incoming.decision_log) {
    if (!merged.decision_log.some((e) => e.decision === entry.decision)) {
      merged.decision_log.push(entry);
    }
  }
  return merged;
}

export function projectNameFromFilename(filename: string): string {
  return filename
    .replace(/\.json$/i, "")
    .replace(/-roadmap$/i, "")
    .trim();
}
