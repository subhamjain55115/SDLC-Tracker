"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import Header from "@/components/Header";
import { projectNameFromFilename } from "@/lib/roadmap";
import type { ProjectSummary } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function HomePage() {
  const { data, mutate, isLoading } = useSWR<{ data: ProjectSummary[] }>("/api/projects", fetcher);
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploadError("");
    setUploading(true);
    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        setUploadError(`${file.name} is not valid JSON`);
        return;
      }
      const name = projectNameFromFilename(file.name);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, roadmap: parsed }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const details = body?.error?.details?.join?.("; ");
        setUploadError(body?.error?.message + (details ? ` — ${details}` : "") || "Upload failed");
        return;
      }
      await mutate();
    } finally {
      setUploading(false);
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
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
            <button
              className="btn-primary"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "+ New Project"}
            </button>
          </div>
        </div>

        {uploadError && (
          <p role="alert" className="mb-4 rounded-lg border border-red-800 bg-red-950 px-4 py-2 text-sm text-red-300">
            {uploadError}
          </p>
        )}

        {isLoading && <p className="text-slate-400">Loading projects...</p>}

        {!isLoading && projects.length === 0 && (
          <div className="card text-center">
            <p className="mb-2 text-slate-300">No projects yet.</p>
            <p className="text-sm text-slate-500">
              Upload a <code className="text-indigo-400">&lt;name&gt;-roadmap.json</code> file, or
              create one in{" "}
              <Link href="/build" className="text-indigo-400 underline">
                Build Mode
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
