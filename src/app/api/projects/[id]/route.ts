import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import Project from "@/lib/models/Project";
import { applyAction } from "@/lib/roadmap-actions";
import type { Roadmap } from "@/lib/types";

interface RouteParams {
  params: { id: string };
}

async function loadProject(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  await dbConnect();
  return Project.findById(id);
}

export async function GET(_request: Request, { params }: RouteParams) {
  if (!(await getServerSession(authOptions))) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }
  const project = await loadProject(params.id);
  if (!project) {
    return NextResponse.json({ error: { message: "Project not found" } }, { status: 404 });
  }
  return NextResponse.json({
    data: {
      id: project._id.toString(),
      name: project.name,
      roadmap: project.roadmap,
      lastUpdated: project.updatedAt,
    },
  });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  if (!(await getServerSession(authOptions))) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }
  const project = await loadProject(params.id);
  if (!project) {
    return NextResponse.json({ error: { message: "Project not found" } }, { status: 404 });
  }
  const body = await request.json().catch(() => null);
  const action = typeof body?.action === "string" ? body.action : "";
  const payload = body?.payload && typeof body.payload === "object" ? body.payload : {};

  const result = applyAction(project.roadmap as Roadmap, action, payload);
  if (!result.ok) {
    return NextResponse.json(
      { error: { message: result.error.message } },
      { status: result.error.status }
    );
  }
  project.roadmap = result.roadmap;
  project.markModified("roadmap");
  await project.save();
  return NextResponse.json({ data: { roadmap: project.roadmap } });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  if (!(await getServerSession(authOptions))) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }
  const project = await loadProject(params.id);
  if (!project) {
    return NextResponse.json({ error: { message: "Project not found" } }, { status: 404 });
  }
  await project.deleteOne();
  return new NextResponse(null, { status: 204 });
}
