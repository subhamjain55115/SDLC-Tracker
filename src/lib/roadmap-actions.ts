import {
  deriveStatuses,
  gateConfirmed,
  phaseTasksComplete,
  taskIsDone,
} from "./roadmap";
import type { Roadmap } from "./types";

export interface ActionError {
  status: number;
  message: string;
}

export type ActionResult = { ok: true; roadmap: Roadmap } | { ok: false; error: ActionError };

function fail(status: number, message: string): ActionResult {
  return { ok: false, error: { status, message } };
}

function findPhase(roadmap: Roadmap, phaseNumber: number) {
  return roadmap.phases.find((p) => p.number === phaseNumber);
}

function refreshTaskState(roadmap: Roadmap, phaseNumber: number) {
  const phase = findPhase(roadmap, phaseNumber);
  if (!phase) return;
  for (const task of phase.tasks) {
    if (task.sub_steps.length > 0) {
      task.done = task.sub_steps.every((s) => s.done);
    }
  }
  phase.phase_gate.tasks_complete = phaseTasksComplete(phase);
  if (phase.status !== "DONE" && phase.tasks.some((t) => taskIsDone(t) || t.sub_steps.some((s) => s.done))) {
    phase.status = "IN PROGRESS";
  }
}

function phaseIsUnlocked(roadmap: Roadmap, phaseNumber: number): boolean {
  const index = roadmap.phases.findIndex((p) => p.number === phaseNumber);
  if (index === -1) return false;
  const statuses = deriveStatuses(roadmap.phases);
  return statuses[index] !== "LOCKED";
}

export function applyAction(
  roadmap: Roadmap,
  action: string,
  payload: Record<string, unknown>
): ActionResult {
  switch (action) {
    case "tick_substep": {
      const { phase: phaseNumber, task: taskId, substep: subStepId, done } = payload as {
        phase: number;
        task: number;
        substep: string;
        done: boolean;
      };
      const phase = findPhase(roadmap, phaseNumber);
      if (!phase) return fail(404, "Phase not found");
      if (!phaseIsUnlocked(roadmap, phaseNumber)) {
        return fail(409, "Phase is locked — complete the previous phase first");
      }
      const task = phase.tasks.find((t) => t.id === taskId);
      if (!task) return fail(404, "Task not found");
      const step = task.sub_steps.find((s) => s.id === subStepId);
      if (!step) return fail(404, "Sub-step not found");
      step.done = done === true;
      refreshTaskState(roadmap, phaseNumber);
      return { ok: true, roadmap };
    }

    case "tick_task": {
      const { phase: phaseNumber, task: taskId, done } = payload as {
        phase: number;
        task: number;
        done: boolean;
      };
      const phase = findPhase(roadmap, phaseNumber);
      if (!phase) return fail(404, "Phase not found");
      if (!phaseIsUnlocked(roadmap, phaseNumber)) {
        return fail(409, "Phase is locked — complete the previous phase first");
      }
      const task = phase.tasks.find((t) => t.id === taskId);
      if (!task) return fail(404, "Task not found");
      if (task.sub_steps.length > 0) {
        return fail(400, "Task has sub-steps — tick those instead");
      }
      task.done = done === true;
      refreshTaskState(roadmap, phaseNumber);
      return { ok: true, roadmap };
    }

    case "set_gate_item": {
      const { phase: phaseNumber, item, value } = payload as {
        phase: number;
        item: string;
        value: boolean;
      };
      const allowed = ["done_criterion_met", "code_review_passed", "commit_done"];
      if (!allowed.includes(item)) return fail(400, "Invalid gate item");
      const phase = findPhase(roadmap, phaseNumber);
      if (!phase) return fail(404, "Phase not found");
      if (!phaseTasksComplete(phase)) {
        return fail(409, "Phase gate is locked until all tasks are complete");
      }
      phase.phase_gate.tasks_complete = true;
      if (item === "done_criterion_met") phase.phase_gate.done_criterion_met = value === true;
      if (item === "code_review_passed") phase.phase_gate.code_review_passed = value === true;
      if (item === "commit_done") phase.phase_gate.commit_done = value === true;
      return { ok: true, roadmap };
    }

    case "confirm_gate": {
      const { phase: phaseNumber, date } = payload as { phase: number; date?: string };
      const phase = findPhase(roadmap, phaseNumber);
      if (!phase) return fail(404, "Phase not found");
      const gate = phase.phase_gate;
      if (
        !phaseTasksComplete(phase) ||
        !gate.done_criterion_met ||
        !gate.code_review_passed ||
        !gate.commit_done
      ) {
        return fail(409, "All four gate items must be confirmed before completing the phase");
      }
      gate.tasks_complete = true;
      gate.confirmed_at = new Date().toISOString();
      phase.status = "DONE";
      phase.completed_date =
        typeof date === "string" && date ? date : new Date().toISOString().slice(0, 10);
      return { ok: true, roadmap };
    }

    case "add_backlog": {
      const { idea, why_deferred } = payload as { idea: string; why_deferred: string };
      if (!idea || typeof idea !== "string") return fail(400, "Idea text is required");
      roadmap.v2_backlog.push({
        date: new Date().toISOString().slice(0, 10),
        idea: idea.trim(),
        why_deferred: typeof why_deferred === "string" ? why_deferred.trim() : "",
      });
      return { ok: true, roadmap };
    }

    case "add_decision": {
      const { decision, reason, phase } = payload as {
        decision: string;
        reason: string;
        phase: string;
      };
      if (!decision || typeof decision !== "string") return fail(400, "Decision text is required");
      roadmap.decision_log.push({
        date: new Date().toISOString().slice(0, 10),
        decision: decision.trim(),
        reason: typeof reason === "string" ? reason.trim() : "",
        phase: typeof phase === "string" ? phase.trim() : "",
      });
      return { ok: true, roadmap };
    }

    case "set_notes": {
      const { phase: phaseNumber, notes } = payload as { phase: number; notes: string };
      const phase = findPhase(roadmap, phaseNumber);
      if (!phase) return fail(404, "Phase not found");
      phase.notes = typeof notes === "string" ? notes : "";
      return { ok: true, roadmap };
    }

    default:
      return fail(400, `Unknown action: ${action}`);
  }
}

export { gateConfirmed };
