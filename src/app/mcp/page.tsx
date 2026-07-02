"use client";

import { useState } from "react";
import Header from "@/components/Header";

const REGISTER_CMD =
  'claude mcp add --scope user sdlc-tracker -- cmd /c "npx tsx C:\\Users\\LENOVO\\Desktop\\SDLCTracker\\mcp-server\\index.mts"';

const TOOLS = [
  { name: "list_projects", what: "All projects with progress % and current phase" },
  { name: "get_project_state", what: "Full live state: every phase, task, sub-step tick, and gate — Claude reads this instead of asking you" },
  { name: "tick_substep", what: "Mark a sub-step done/undone after completing the work" },
  { name: "tick_task", what: "Mark a task without sub-steps done/undone" },
  { name: "set_gate_item", what: "Set done_criterion_met / code_review_passed / commit_done (only when all tasks complete)" },
  { name: "confirm_gate", what: "Confirm the phase gate — phase becomes DONE, next phase unlocks (only on your PHASE DONE: signal)" },
  { name: "add_backlog_item", what: "Capture an out-of-scope idea into the V2 backlog (scope lock rule)" },
  { name: "add_decision", what: "Log a micro-decision into the decision log" },
];

function CopyBlock({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <button
          className="btn-ghost text-xs"
          onClick={() => {
            void navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-emerald-300">
        {text}
      </pre>
    </div>
  );
}

export default function McpPage() {
  const [name, setName] = useState("");
  const [command, setCommand] = useState("");
  const [scope, setScope] = useState<"user" | "project" | "local">("user");
  const [transport, setTransport] = useState<"stdio" | "http">("stdio");
  const [url, setUrl] = useState("");

  const valid = name.trim() !== "" && (transport === "stdio" ? command.trim() !== "" : url.trim() !== "");
  const addCmd =
    transport === "stdio"
      ? `claude mcp add --scope ${scope} ${name.trim()} -- ${command.trim()}`
      : `claude mcp add --scope ${scope} --transport http ${name.trim()} ${url.trim()}`;
  const jsonSnippet = JSON.stringify(
    {
      mcpServers: {
        [name.trim() || "server-name"]:
          transport === "stdio"
            ? { command: command.trim().split(/\s+/)[0] ?? "", args: command.trim().split(/\s+/).slice(1) }
            : { type: "http", url: url.trim() },
      },
    },
    null,
    2
  );

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        <div>
          <h1 className="text-xl font-bold text-white">MCP Connections</h1>
          <p className="mt-1 text-sm text-slate-400">
            How Claude connects to this tracker, and a builder for registering further MCP connectors.
          </p>
        </div>

        <section className="card space-y-3">
          <h2 className="font-semibold text-white">How the SDLC Tracker MCP server is connected</h2>
          <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs leading-relaxed text-slate-300">
{`Claude Code (any project, any session)
      │  spawns on startup, talks JSON-RPC over stdio
      ▼
Local MCP server        SDLCTracker/mcp-server/index.mts  (npx tsx)
      │  reads .env.local → SUPABASE_SERVICE_ROLE_KEY (never leaves this machine)
      │  reuses the app's own gate/tick logic (applyAction, deriveStatuses)
      ▼  HTTPS
Supabase Postgres (cloud)  ← the single source of truth: projects table
      ▲  HTTPS (same rows)
      │
This web app  →  your browser (Track Mode auto-refreshes every 5s)`}
          </pre>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-400">
            <li>
              Registered at <span className="text-slate-200">user scope</span> — available to Claude in every
              project folder, not just this repo.
            </li>
            <li>
              No new backend and no new credentials: the server runs on this machine and uses the same
              Supabase project as the app, so a tick from Claude and a tick from your browser land in the
              same row.
            </li>
            <li>
              Gate rules are identical everywhere — the MCP server imports the same functions the API uses,
              so Claude cannot tick a locked phase either.
            </li>
          </ul>
          <CopyBlock label="Registration command (already run on this machine — re-run after moving the repo)" text={REGISTER_CMD} />
          <div>
            <p className="mb-2 text-xs font-medium text-slate-400">Tools Claude gets</p>
            <ul className="space-y-1.5">
              {TOOLS.map((t) => (
                <li key={t.name} className="text-sm">
                  <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-indigo-300">{t.name}</code>{" "}
                  <span className="text-slate-400">— {t.what}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="card space-y-4">
          <h2 className="font-semibold text-white">Connector builder — register any further MCP server</h2>
          <p className="text-sm text-slate-400">
            Fill in the connector, copy the command, run it in any terminal. Nothing is stored here.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-slate-400">Server name</span>
              <input className="input" placeholder="e.g. github" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-slate-400">Scope</span>
              <select className="input" value={scope} onChange={(e) => setScope(e.target.value as typeof scope)}>
                <option value="user">user — all projects on this machine</option>
                <option value="project">project — shared via .mcp.json in the repo</option>
                <option value="local">local — this project, this machine only</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-slate-400">Transport</span>
              <select className="input" value={transport} onChange={(e) => setTransport(e.target.value as typeof transport)}>
                <option value="stdio">stdio — local command Claude spawns</option>
                <option value="http">http — remote server URL</option>
              </select>
            </label>
            {transport === "stdio" ? (
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-slate-400">Command</span>
                <input className="input" placeholder='e.g. npx -y @modelcontextprotocol/server-github' value={command} onChange={(e) => setCommand(e.target.value)} />
              </label>
            ) : (
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-slate-400">Server URL</span>
                <input className="input" placeholder="https://mcp.example.com/mcp" value={url} onChange={(e) => setUrl(e.target.value)} />
              </label>
            )}
          </div>
          {valid ? (
            <div className="space-y-3">
              <CopyBlock label="Run this to register" text={addCmd} />
              <CopyBlock label="Or add to .mcp.json (project scope) / settings" text={jsonSnippet} />
              <p className="text-xs text-slate-500">
                Verify with <code className="rounded bg-slate-800 px-1 py-0.5">claude mcp list</code> — the new
                server loads in Claude&apos;s next session. Never put API keys in the command line of a shared
                .mcp.json — use env vars.
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Fill in the fields to generate the registration command.</p>
          )}
        </section>
      </main>
    </>
  );
}
