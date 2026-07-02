"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import Header from "@/components/Header";
import PhaseCard from "@/components/track/PhaseCard";
import Sidebar from "@/components/track/Sidebar";
import { deriveStatuses, roadmapProgress } from "@/lib/roadmap";
import type { Roadmap } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ProjectResponse {
  data?: { id: string; name: string; roadmap: Roadmap };
  error?: { message: string };
}

export default function TrackModePage() {
  const params = useParams<{ id: string }>();
  const { data, mutate, isLoading } = useSWR<ProjectResponse>(
    params?.id ? `/api/projects/${params.id}` : null,
    fetcher,
    { refreshInterval: 5000 }
  );

  const project = data?.data;

  async function onAction(
    action: string,
    payload: Record<string, unknown>
  ): Promise<string | null> {
    const res = await fetch(`/api/projects/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      return body?.error?.message ?? "Update failed";
    }
    await mutate();
    return null;
  }

  function exportProgress() {
    if (!project) return;
    const blob = new Blob([JSON.stringify(project.roadmap, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name}-roadmap.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8 text-slate-400">Loading project...</main>
      </>
    );
  }

  if (!project) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8 text-red-400">
          {data?.error?.message ?? "Project not found"}
        </main>
      </>
    );
  }

  const roadmap = project.roadmap;
  const statuses = deriveStatuses(roadmap.phases);
  const progress = roadmapProgress(roadmap);
  const donePhases = statuses.filter((s) => s === "DONE").length;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-white">{project.name}</h1>
              {roadmap.project.tagline && (
                <p className="text-sm text-slate-400">{roadmap.project.tagline}</p>
              )}
            </div>
            <button className="btn-ghost" onClick={exportProgress}>
              Export Progress JSON
            </button>
          </div>
          {roadmap.project.core_principle && (
            <p className="mt-3 rounded-lg border border-amber-900 bg-amber-950/40 px-3 py-2 text-sm text-amber-300">
              Core principle: {roadmap.project.core_principle}
            </p>
          )}
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-sm text-slate-400">
              <span>
                {progress.doneUnits} of {progress.totalUnits} steps complete
              </span>
              <span>
                {donePhases} of {roadmap.phases.length} phases DONE · {progress.percent}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <nav className="card overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase text-slate-500">
                    <th className="pb-2 pr-4">Phase</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {roadmap.phases.map((phase, i) => (
                    <tr key={phase.number} className="border-t border-slate-800">
                      <td className="py-1.5 pr-4">
                        <a href={`#phase-${phase.number}`} className="text-slate-200 hover:text-indigo-400">
                          Phase {phase.number} — {phase.name}
                        </a>
                      </td>
                      <td className="py-1.5 pr-4 text-slate-400">{statuses[i]}</td>
                      <td className="py-1.5 text-slate-500">{phase.completed_date ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </nav>

            {roadmap.phases.map((phase, i) => (
              <PhaseCard key={phase.number} phase={phase} status={statuses[i]} onAction={onAction} />
            ))}
          </div>

          <Sidebar roadmap={roadmap} onAction={onAction} />
        </div>
      </main>
    </>
  );
}
