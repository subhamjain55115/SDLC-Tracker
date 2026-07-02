import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { applyAction } from "../src/lib/roadmap-actions";
import { deriveStatuses, phaseProgress, roadmapProgress, taskIsDone } from "../src/lib/roadmap";
import type { Roadmap } from "../src/lib/types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env: Record<string, string> = {};
for (const line of readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function loadProject(name: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, roadmap, updated_at")
    .ilike("name", name)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Project '${name}' not found — use list_projects to see available names`);
  return data as { id: string; name: string; roadmap: Roadmap; updated_at: string };
}

async function saveProject(id: string, roadmap: Roadmap) {
  const { error } = await supabase.from("projects").update({ roadmap }).eq("id", id);
  if (error) throw new Error(error.message);
}

function renderState(roadmap: Roadmap): string {
  const statuses = deriveStatuses(roadmap.phases);
  const total = roadmapProgress(roadmap);
  const lines = [
    `${roadmap.project.name} — ${total.doneUnits}/${total.totalUnits} units (${total.percent}%)`,
  ];
  roadmap.phases.forEach((phase, i) => {
    const p = phaseProgress(phase);
    lines.push(
      `Phase ${phase.number} ${phase.name} [${statuses[i]}] ${p.doneUnits}/${p.totalUnits}` +
        (phase.completed_date ? ` done ${phase.completed_date}` : "")
    );
    if (statuses[i] === "IN PROGRESS" || statuses[i] === "PENDING") {
      for (const task of phase.tasks) {
        const mark = taskIsDone(task) ? "x" : " ";
        lines.push(`  [${mark}] ${task.id}. ${task.description}`);
        for (const s of task.sub_steps) {
          lines.push(`      [${s.done ? "x" : " "}] ${s.id} ${s.description}`);
        }
      }
      const g = phase.phase_gate;
      lines.push(
        `  gate: tasks=${g.tasks_complete} criterion=${g.done_criterion_met} review=${g.code_review_passed} commit=${g.commit_done} confirmed=${g.confirmed_at ?? "no"}`
      );
    }
  });
  return lines.join("\n");
}

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] });

async function mutate(projectName: string, action: string, payload: Record<string, unknown>) {
  const row = await loadProject(projectName);
  const result = applyAction(row.roadmap, action, payload);
  if (!result.ok) throw new Error(result.error.message);
  await saveProject(row.id, result.roadmap);
  return renderState(result.roadmap);
}

const server = new McpServer({ name: "sdlc-tracker", version: "1.0.0" });

server.tool(
  "list_projects",
  "List all projects in the SDLC Tracker with progress summary",
  {},
  async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("name, roadmap, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    const rows = (data ?? []).map((p) => {
      const r = p.roadmap as Roadmap;
      const prog = roadmapProgress(r);
      const statuses = deriveStatuses(r.phases);
      const current = r.phases.find((_, i) => statuses[i] === "IN PROGRESS" || statuses[i] === "PENDING");
      return `${p.name}: ${prog.percent}% — current: ${current ? `Phase ${current.number} ${current.name}` : "all phases done"} (updated ${p.updated_at})`;
    });
    return text(rows.join("\n") || "No projects yet");
  }
);

server.tool(
  "get_project_state",
  "Full live state of one project: every phase, task, sub-step tick, and gate. This is the single source of truth for progress — read it instead of asking the user where the project stands.",
  { project: z.string().describe("Project name (case-insensitive)") },
  async ({ project }) => text(renderState((await loadProject(project)).roadmap))
);

server.tool(
  "tick_substep",
  "Mark a sub-step done (or undone) after completing the corresponding work",
  {
    project: z.string(),
    phase: z.number().describe("Phase number, e.g. -1, 1, 2"),
    task: z.number().describe("Task id within the phase"),
    substep: z.string().describe("Sub-step id, e.g. '2a'"),
    done: z.boolean().default(true),
  },
  async ({ project, phase, task, substep, done }) =>
    text(await mutate(project, "tick_substep", { phase, task, substep, done }))
);

server.tool(
  "tick_task",
  "Mark a task without sub-steps done (or undone)",
  {
    project: z.string(),
    phase: z.number(),
    task: z.number(),
    done: z.boolean().default(true),
  },
  async ({ project, phase, task, done }) => text(await mutate(project, "tick_task", { phase, task, done }))
);

server.tool(
  "set_gate_item",
  "Set one of the three manual phase-gate items (done_criterion_met, code_review_passed, commit_done). Only allowed once all tasks in the phase are complete.",
  {
    project: z.string(),
    phase: z.number(),
    item: z.enum(["done_criterion_met", "code_review_passed", "commit_done"]),
    value: z.boolean().default(true),
  },
  async ({ project, phase, item, value }) => text(await mutate(project, "set_gate_item", { phase, item, value }))
);

server.tool(
  "confirm_gate",
  "Confirm a phase gate — marks the phase DONE and unlocks the next phase. Requires all four gate items true. Only call after the human has agreed the phase is done (PHASE DONE: signal).",
  { project: z.string(), phase: z.number() },
  async ({ project, phase }) => text(await mutate(project, "confirm_gate", { phase }))
);

server.tool(
  "add_backlog_item",
  "Capture an out-of-scope idea in the project's V2 backlog (scope lock rule)",
  { project: z.string(), idea: z.string(), why_deferred: z.string() },
  async ({ project, idea, why_deferred }) => {
    const today = new Date().toISOString().slice(0, 10);
    return text(await mutate(project, "add_backlog", { date: today, idea, why_deferred }));
  }
);

server.tool(
  "add_decision",
  "Log a micro-decision in the project's decision log",
  { project: z.string(), decision: z.string(), reason: z.string(), phase: z.string() },
  async ({ project, decision, reason, phase }) => {
    const today = new Date().toISOString().slice(0, 10);
    return text(await mutate(project, "add_decision", { date: today, decision, reason, phase }));
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
