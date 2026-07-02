"use client";

import { useState } from "react";
import type { Roadmap } from "@/lib/types";

interface Props {
  roadmap: Roadmap;
  onAction: (action: string, payload: Record<string, unknown>) => Promise<string | null>;
}

export default function Sidebar({ roadmap, onAction }: Props) {
  const [idea, setIdea] = useState("");
  const [ideaWhy, setIdeaWhy] = useState("");
  const [decision, setDecision] = useState("");
  const [decisionReason, setDecisionReason] = useState("");

  async function addIdea() {
    if (!idea.trim()) return;
    await onAction("add_backlog", { idea, why_deferred: ideaWhy });
    setIdea("");
    setIdeaWhy("");
  }

  async function addDecision() {
    if (!decision.trim()) return;
    await onAction("add_decision", { decision, reason: decisionReason, phase: "" });
    setDecision("");
    setDecisionReason("");
  }

  return (
    <aside className="space-y-4">
      <section className="card">
        <h2 className="mb-2 font-semibold text-white">Scope Lock — V2 Backlog</h2>
        <p className="mb-3 text-xs text-slate-500">
          New ideas go here, not into the current phase.
        </p>
        <ul className="mb-3 max-h-48 space-y-2 overflow-y-auto text-sm">
          {roadmap.v2_backlog.length === 0 && <li className="text-slate-500">Empty</li>}
          {roadmap.v2_backlog.map((item, i) => (
            <li key={i} className="rounded border border-slate-800 p-2">
              <p className="text-slate-200">{item.idea}</p>
              {item.why_deferred && <p className="text-xs text-slate-500">{item.why_deferred}</p>}
            </li>
          ))}
        </ul>
        <div className="space-y-2">
          <input
            className="input"
            placeholder="New V2 idea..."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
          />
          <input
            className="input"
            placeholder="Why deferred (optional)"
            value={ideaWhy}
            onChange={(e) => setIdeaWhy(e.target.value)}
          />
          <button className="btn-ghost w-full" onClick={addIdea}>
            + Add V2 Idea
          </button>
        </div>
      </section>

      <section className="card">
        <h2 className="mb-2 font-semibold text-white">Decision Log</h2>
        <ul className="mb-3 max-h-48 space-y-2 overflow-y-auto text-sm">
          {roadmap.decision_log.length === 0 && <li className="text-slate-500">Empty</li>}
          {roadmap.decision_log.map((entry, i) => (
            <li key={i} className="rounded border border-slate-800 p-2">
              <p className="text-slate-200">{entry.decision}</p>
              <p className="text-xs text-slate-500">
                {entry.date}
                {entry.reason ? ` — ${entry.reason}` : ""}
              </p>
            </li>
          ))}
        </ul>
        <div className="space-y-2">
          <input
            className="input"
            placeholder="Decision made..."
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
          />
          <input
            className="input"
            placeholder="Reason (optional)"
            value={decisionReason}
            onChange={(e) => setDecisionReason(e.target.value)}
          />
          <button className="btn-ghost w-full" onClick={addDecision}>
            + Log Decision
          </button>
        </div>
      </section>
    </aside>
  );
}
