import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import Project from "@/lib/models/Project";
import {
  currentPhaseName,
  deriveStatuses,
  mergeRoadmaps,
  roadmapProgress,
  validateAndNormalize,
} from "@/lib/roadmap";
import type { ProjectSummary, Roadmap } from "@/lib/types";

async function requireSession() {
  const session = await getServerSession(authOptions);
  return session;
}

export async function GET() {
  if (!(await requireSession())) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }
  await dbConnect();
  const projects = await Project.find().sort({ updatedAt: -1 }).lean();
  const summaries: ProjectSummary[] = projects.map((p: any) => {
    const roadmap = p.roadmap as Roadmap;
    const progress = roadmapProgress(roadmap);
    const statuses = deriveStatuses(roadmap.phases);
    return {
      id: p._id.toString(),
      name: p.name,
      tagline: roadmap.project.tagline || roadmap.project.description,
      totalPhases: roadmap.phases.length,
      donePhases: statuses.filter((s) => s === "DONE").length,
      totalSubSteps: progress.totalUnits,
      doneSubSteps: progress.doneUnits,
      percent: progress.percent,
      currentPhase: currentPhaseName(roadmap),
      lastUpdated: p.updatedAt?.toISOString?.() ?? "",
    };
  });
  return NextResponse.json({ data: summaries });
}

export async function POST(request: Request) {
  if (!(await requireSession())) {
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

  await dbConnect();
  const existing = await Project.findOne({ name: projectName });
  if (existing) {
    const merged = mergeRoadmaps(existing.roadmap as Roadmap, roadmap);
    existing.roadmap = merged;
    existing.markModified("roadmap");
    await existing.save();
    return NextResponse.json({ data: { id: existing._id.toString(), merged: true } });
  }
  const created = await Project.create({ name: projectName, roadmap });
  return NextResponse.json(
    { data: { id: created._id.toString(), merged: false } },
    { status: 201 }
  );
}
