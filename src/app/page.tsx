"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import Header from "@/components/Header";
import { projectNameFromFilename } from "@/lib/roadmap";
import type { ProjectSummary } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function HomePage() {
  const { data, mutate, isLoading } = useSWR<{ data: ProjectSummary[] }>("/api/projects", fetcher, {
    refreshInterval: 10000,
  });
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadErrorDetails, setUploadErrorDetails] = useState<string[]>([]);
  const [uploadStep, setUploadStep] = useState<"" | "converting" | "uploading">("");

  async function handleFile(file: File) {
    setUploadError("");
    setUploadErrorDetails([]);
    try {
      const text = await file.text();
      let name: string;
      let roadmap: unknown;

      if (file.name.toLowerCase().endsWith(".md")) {
        setUploadStep("converting");
        const res = await fetch("/api/convert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markdown: text }),
        });
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          setUploadError(body?.error?.message ?? `Could not convert ${file.name}`);
          setUploadErrorDetails(body?.error?.details ?? []);
          return;
        }
        roadmap = body.data.roadmap;
        name = body.data.roadmap.project.name;
      } else {
        try {
          roadmap = JSON.parse(text);
        } catch {
          setUploadError(`${file.name} is not valid JSON`);
          return;
        }
        name = projectNameFromFilename(file.name);
      }

      setUploadStep("uploading");
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, roadmap }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setUploadError(body?.error?.message ?? "Upload failed");
        setUploadErrorDetails(body?.error?.details ?? []);
        return;
      }
      await mutate();
    } finally {
      setUploadStep("");
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function handleDelete(project: ProjectSummary) {
    if (!confirm(`Delete "${project.name}" and all its progress? This cannot be undone.`)) return;
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    await mutate();
  }

  const projects = data?.data ?? [];

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Projects</h1>
          <div className="flex gap-2">
            <input
              ref={fileInput}
              type="file"
              accept=".json,.md,application/json,text/markdown"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
            <button
              className="btn-primary"
              onClick={() => fileInput.current?.click()}
              disabled={uploadStep !== ""}
            >
              {uploadStep === "converting"
                ? "Converting markdown..."
                : uploadStep === "uploading"
                  ? "Uploading..."
                  : "+ New Project"}
            </button>
          </div>
        </div>

        {uploadStep !== "" && (
          <p aria-live="polite" className="mb-4 flex items-center gap-2 rounded-lg border border-indigo-900 bg-indigo-950/40 px-4 py-2 text-sm text-indigo-300">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
            {uploadStep === "converting"
              ? "Step 1 of 2 — converting roadmap.md to JSON..."
              : "Step 2 of 2 — uploading to Track Mode..."}
          </p>
        )}

        {uploadError && (
          <div role="alert" className="mb-4 rounded-lg border border-red-800 bg-red-950 px-4 py-2 text-sm text-red-300">
            <p>{uploadError}</p>
            {uploadErrorDetails.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-xs text-red-400">
                {uploadErrorDetails.slice(0, 10).map((d) => (
                  <li key={d}>{d}</li>
                ))}
                {uploadErrorDetails.length > 10 && (
                  <li>...and {uploadErrorDetails.length - 10} more</li>
                )}
              </ul>
            )}
          </div>
        )}

        {isLoading && <p className="text-slate-400">Loading projects...</p>}

        {!isLoading && projects.length === 0 && (
          <div className="card text-center">
            <p className="mb-2 text-slate-300">No projects yet.</p>
            <p className="text-sm text-slate-500">
              Upload a <code className="text-indigo-400">development-roadmap.md</code> (strict
              format — converted automatically) or a{" "}
              <code className="text-indigo-400">&lt;name&gt;-roadmap.json</code>, or create one in{" "}
              <Link href="/build" className="text-indigo-400 underline">
                Manual Build Mode
              </Link>
              .
            </p>
          </div>
        )}

        <ul className="space-y-3">
          {projects.map((p) => (
            <li key={p.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href={`/projects/${p.id}`} className="flex-1 space-y-2">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-semibold text-white">{p.name}</span>
                  <span className="text-sm text-slate-400">
                    {p.donePhases} / {p.totalPhases} phases · {p.percent}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${p.percent}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">{p.currentPhase}</p>
              </Link>
              <button
                className="btn-ghost self-end text-red-400 hover:border-red-500 sm:self-center"
                onClick={() => handleDelete(p)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
