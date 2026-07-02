"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { QUICK_BUILD_STORAGE_KEY, QUICK_STAGES } from "@/lib/quick-build";

type Ticks = Record<string, boolean>;

export default function QuickBuildPage() {
  const [stage, setStage] = useState(0);
  const [ticks, setTicks] = useState<Ticks>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(QUICK_BUILD_STORAGE_KEY);
      if (saved) setTicks(JSON.parse(saved));
    } catch {
      // corrupt state — start fresh
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(QUICK_BUILD_STORAGE_KEY, JSON.stringify(ticks));
  }, [ticks, loaded]);

  const stageDone = QUICK_STAGES.map((s) => s.items.every((item) => ticks[item.id]));
  const totalItems = QUICK_STAGES.reduce((n, s) => n + s.items.length, 0);
  const doneItems = QUICK_STAGES.reduce(
    (n, s) => n + s.items.filter((item) => ticks[item.id]).length,
    0
  );
  const allDone = doneItems === totalItems;
  const current = QUICK_STAGES[stage];

  function toggle(id: string) {
    setTicks((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function reset() {
    if (!confirm("Untick everything and start a new Quick Build?")) return;
    setTicks({});
    setStage(0);
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Quick Build Mode</h1>
          <button className="btn-ghost text-red-400" onClick={reset}>
            Reset checklist
          </button>
        </div>
        <p className="mb-6 text-sm text-slate-400">
          You do the brainstorm, plan, and roadmap in conversation with Claude — this page is your
          checkpoint list. Read each item, convey it to the AI, tick it here. Nothing is typed or
          exported from this page.
        </p>

        <div className="mb-6">
          <div className="mb-1 flex justify-between text-xs text-slate-400">
            <span>
              {doneItems} / {totalItems} conveyed
            </span>
            <span>{Math.round((doneItems / totalItems) * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-800">
            <div
              className="h-2 rounded-full bg-indigo-500 transition-all"
              style={{ width: `${(doneItems / totalItems) * 100}%` }}
            />
          </div>
        </div>

        <nav className="mb-6 flex gap-2 overflow-x-auto">
          {QUICK_STAGES.map((s, i) => {
            const reachable = i === 0 || stageDone.slice(0, i).every(Boolean);
            return (
              <button
                key={s.name}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${
                  i === stage
                    ? "bg-indigo-600 text-white"
                    : reachable
                      ? "border border-slate-700 text-slate-300 hover:border-slate-500"
                      : "border border-slate-800 text-slate-600"
                }`}
                disabled={!reachable}
                onClick={() => reachable && setStage(i)}
              >
                {s.name}
                {stageDone[i] ? " ✓" : ""}
              </button>
            );
          })}
        </nav>

        <p className="mb-5 text-sm text-slate-400">{current.intro}</p>

        <div className="space-y-3">
          {current.items.map((item, i) => {
            const done = !!ticks[item.id];
            return (
              <label
                key={item.id}
                className={`card flex cursor-pointer items-start gap-3 transition-colors ${
                  done ? "border-emerald-800/60 bg-emerald-950/20" : "hover:border-slate-600"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 shrink-0 accent-indigo-500"
                  checked={done}
                  onChange={() => toggle(item.id)}
                />
                <span>
                  <span className={`font-medium ${done ? "text-emerald-300" : "text-white"}`}>
                    {i + 1}. {item.label}
                  </span>
                  <span className="mt-1 block text-sm text-slate-400">{item.description}</span>
                </span>
              </label>
            );
          })}
        </div>

        <div
          className={`mt-6 rounded-lg border px-4 py-3 text-sm ${
            stageDone[stage]
              ? "border-emerald-800 bg-emerald-950/30 text-emerald-300"
              : "border-slate-800 bg-slate-900/50 text-slate-500"
          }`}
        >
          {stageDone[stage] ? "✓ " : "→ "}
          {current.artifact}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button className="btn-ghost" disabled={stage === 0} onClick={() => setStage((s) => s - 1)}>
            ← Back
          </button>
          {stage < QUICK_STAGES.length - 1 ? (
            <button
              className="btn-primary"
              disabled={!stageDone[stage]}
              onClick={() => setStage((s) => s + 1)}
            >
              {stageDone[stage] ? "Next →" : "Tick everything first"}
            </button>
          ) : (
            allDone && (
              <Link href="/" className="btn-primary">
                Go to Projects → upload the JSON
              </Link>
            )
          )}
        </div>
      </main>
    </>
  );
}
