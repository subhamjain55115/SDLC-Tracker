import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  currentPhaseName,
  deriveStatuses,
  mergeRoadmaps,
  roadmapProgress,
  validateAndNormalize,
} from "@/lib/roadmap";
import type { ProjectSummary, Roadmap } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("projects")
    .select("id, name, roadmap, updated_at")
    .order("updated_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }

  const summaries: ProjectSummary[] = (data ?? []).map((p) => {
    const roadmap = p.roadmap as Roadmap;
    const progress = roadmapProgress(roadmap);
    const statuses = deriveStatuses(roadmap.phases);
    return {
      id: p.id,
      name: p.name,
      tagline: roadmap.project.tagline || roadmap.project.description,
      totalPhases: roadmap.phases.length,
      donePhases: statuses.filter((s) => s === "DONE").length,
      totalSubSteps: progress.totalUnits,
      doneSubSteps: progress.doneUnits,
      percent: progress.percent,
      currentPhase: currentPhaseName(roadmap),
      lastUpdated: p.updated_at ?? "",
    };
  });
  return NextResponse.json({ data: summaries });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Request body must be JSON" } },
      { status: 400 }
    );
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const result = validateAndNormalize(body.roadmap);
  if (!result.ok || !result.roadmap) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid roadmap JSON", details: result.errors } },
      { status: 422 }
    );
  }
  const roadmap = result.roadmap;
  const projectName = name || roadmap.project.name;
  if (!projectName) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Project name is required" } },
      { status: 400 }
    );
  }
  roadmap.project.name = projectName;

  const { data: existing, error: findError } = await supabase
    .from("projects")
    .select("id, roadmap")
    .eq("name", projectName)
    .maybeSingle();
  if (findError) {
    return NextResponse.json({ error: { message: findError.message } }, { status: 500 });
  }

  if (existing) {
    const merged = mergeRoadmaps(existing.roadmap as Roadmap, roadmap);
    const { error: updateError } = await supabase
      .from("projects")
      .update({ roadmap: merged })
      .eq("id", existing.id);
    if (updateError) {
      return NextResponse.json({ error: { message: updateError.message } }, { status: 500 });
    }
    return NextResponse.json({ data: { id: existing.id, merged: true } });
  }

  const { data: created, error: insertError } = await supabase
    .from("projects")
    .insert({ name: projectName, roadmap })
    .select("id")
    .single();
  if (insertError) {
    return NextResponse.json({ error: { message: insertError.message } }, { status: 500 });
  }
  return NextResponse.json({ data: { id: created.id, merged: false } }, { status: 201 });
}
