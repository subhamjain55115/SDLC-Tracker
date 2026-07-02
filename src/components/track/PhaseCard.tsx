"use client";

import { useState } from "react";
import { phaseProgress, phaseTasksComplete, taskIsDone } from "@/lib/roadmap";
import type { DerivedStatus, Phase } from "@/lib/types";

const STATUS_STYLE: Record<DerivedStatus, string> = {
  DONE: "bg-emerald-900 text-emerald-300 border-emerald-700",
  "IN PROGRESS": "bg-blue-900 text-blue-300 border-blue-700",
  PENDING: "bg-slate-800 text-slate-300 border-slate-600",
  LOCKED: "bg-slate-900 text-slate-500 border-slate-800",
};

const STATUS_LABEL: Record<DerivedStatus, string> = {
  DONE: "✅ DONE",
  "IN PROGRESS": "🔵 IN PROGRESS",
  PENDING: "⏳ PENDING",
  LOCKED: "🔒 LOCKED",
};

const TAG_COLOUR: Record<string, string> = {
  inception: "text-purple-400",
  architecture: "text-cyan-400",
  backend: "text-blue-400",
  frontend: "text-pink-400",
  testing: "text-yellow-400",
  devops: "text-orange-400",
  release: "text-emerald-400",
  security: "text-red-400",
};

interface Props {
  phase: Phase;
  status: DerivedStatus;
  onAction: (action: string, payload: Record<string, unknown>) => Promise<string | null>;
}

export default function PhaseCard({ phase, status, onAction }: Props) {
  const [open, setOpen] = useState(status === "IN PROGRESS");
  const [error, setError] = useState("");
  const progress = phaseProgress(phase);
  const locked = status === "LOCKED";
  const gateOpen = phaseTasksComplete(phase) && status !== "DONE";
  const gate = phase.phase_gate;

  async function act(action: string, payload: Record<string, unknown>) {
    setError("");
    const err = await onAction(action, payload);
    if (err) setError(err);
  }

  return (
    <section className={`card ${locked ? "opacity-60" : ""}`} id={`phase-${phase.number}`}>
      <button
        className="flex w-full items-center justify-between gap-3 text-left"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-white">
              Phase {phase.number} — {phase.name}
            </span>
            <span className={`text-xs font-semibold uppercase ${TAG_COLOUR[phase.colour_tag] ?? "text-slate-400"}`}>
              {phase.colour_tag}
            </span>
          </div>
          {phase.one_line_mission && (
            <p className="mt-1 text-sm text-slate-400">{phase.one_line_mission}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[status]}`}>
            {STATUS_LABEL[status]}
          </span>
          <span className="text-xs text-slate-500">
            {progress.doneUnits}/{progress.totalUnits} · {progress.percent}%
          </span>
        </div>
      </button>

      {open && (
        <div className="mt-4 space-y-4 border-t border-slate-800 pt-4">
          {locked && (
            <p className="text-sm text-slate-500">
              Complete the previous phase to unlock this one.
            </p>
          )}

          {phase.tasks.map((task) => {
            const done = taskIsDone(task);
            return (
              <div key={task.id} className={`rounded-lg border p-3 ${done ? "border-emerald-800 bg-emerald-950/30" : "border-slate-800"}`}>
                <div className="flex items-start gap-2">
                  {task.sub_steps.length === 0 && (
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-indigo-500"
                      checked={task.done}
                      disabled={locked || status === "DONE"}
                      onChange={(e) =>
                        act("tick_task", { phase: phase.number, task: task.id, done: e.target.checked })
                      }
                      aria-label={`Task ${task.id}: ${task.description}`}
                    />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${done ? "text-emerald-300" : "text-slate-200"}`}>
                      {task.id}. {task.description}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
                      {task.ce_driver && (
                        <span className="rounded bg-orange-950 px-1.5 py-0.5 text-orange-300">{task.ce_driver}</span>
                      )}
                      {task.context_skills.map((s) => (
                        <span key={s} className="rounded bg-purple-950 px-1.5 py-0.5 text-purple-300">{s}</span>
                      ))}
                      {task.sub_op_plugins.map((p) => (
                        <span key={p} className="rounded bg-rose-950 px-1.5 py-0.5 text-rose-300">{p}</span>
                      ))}
                    </div>
                    {task.one_line_treatment && (
                      <p className="mt-1 text-xs italic text-slate-500">{task.one_line_treatment}</p>
                    )}
                  </div>
                </div>

                {task.sub_steps.length > 0 && (
                  <ul className="mt-2 space-y-1.5 border-l border-slate-800 pl-4">
                    {task.sub_steps.map((step) => (
                      <li key={step.id} className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          id={`step-${phase.number}-${task.id}-${step.id}`}
                          className="mt-0.5 h-4 w-4 accent-indigo-500"
                          checked={step.done}
                          disabled={locked || status === "DONE"}
                          onChange={(e) =>
                            act("tick_substep", {
                              phase: phase.number,
                              task: task.id,
                              substep: step.id,
                              done: e.target.checked,
                            })
                          }
                        />
                        <label
                          htmlFor={`step-${phase.number}-${task.id}-${step.id}`}
                          className={`text-sm ${step.done ? "text-slate-500 line-through" : "text-slate-300"}`}
                        >
                          <span className="mr-1 font-mono text-xs text-slate-500">{step.id}</span>
                          {step.description}
                          {step.expected_output && (
                            <span className="block text-xs text-slate-500">
                              Expected: {step.expected_output}
                            </span>
                          )}
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}

          {phase.done_criterion && (
            <div className="rounded-lg border border-yellow-900 bg-yellow-950/40 p-3">
              <p className="text-xs font-semibold uppercase text-yellow-500">Done criterion</p>
              <p className="mt-1 text-sm text-yellow-200">{phase.done_criterion}</p>
            </div>
          )}

          {status === "DONE" && (
            <p className="text-sm text-emerald-400">
              Phase completed on {phase.completed_date}. Gate confirmed.
            </p>
          )}

          {gateOpen && (
            <div className="rounded-lg border border-indigo-800 bg-indigo-950/40 p-4">
              <p className="mb-3 font-semibold text-indigo-300">
                Phase Gate — confirm all four to complete this phase
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-emerald-400">
                  <input type="checkbox" checked readOnly className="h-4 w-4 accent-emerald-500" />
                  1. All tasks in this phase are complete
                </li>
                {(
                  [
                    ["done_criterion_met", "2. Done criterion is met — verified, not assumed"],
                    ["code_review_passed", "3. /ce-code-review passed — no unresolved blockers"],
                    ["commit_done", "4. /ce-commit done — work is in git history"],
                  ] as const
                ).map(([item, label]) => (
                  <li key={item} className="flex items-center gap-2 text-slate-200">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-indigo-500"
                      checked={gate[item]}
                      onChange={(e) =>
                        act("set_gate_item", { phase: phase.number, item, value: e.target.checked })
                      }
                    />
                    {label}
                  </li>
                ))}
              </ul>
              <button
                className="btn-primary mt-4"
                disabled={!gate.done_criterion_met || !gate.code_review_passed || !gate.commit_done}
                onClick={() => act("confirm_gate", { phase: phase.number })}
              >
                Confirm Phase Complete → Unlock Next Phase
              </button>
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
