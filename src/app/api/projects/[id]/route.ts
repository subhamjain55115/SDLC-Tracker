import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { applyAction } from "@/lib/roadmap-actions";
import type { Roadmap } from "@/lib/types";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RouteParams {
  params: { id: string };
}

async function getAuthedClient() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { supabase, user } = await getAuthedClient();
  if (!user) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }
  if (!UUID_RE.test(params.id)) {
    return NextResponse.json({ error: { message: "Project not found" } }, { status: 404 });
  }
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, roadmap, updated_at")
    .eq("id", params.id)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: { message: "Project not found" } }, { status: 404 });
  }
  return NextResponse.json({
    data: { id: data.id, name: data.name, roadmap: data.roadmap, lastUpdated: data.updated_at },
  });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { supabase, user } = await getAuthedClient();
  if (!user) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }
  if (!UUID_RE.test(params.id)) {
    return NextResponse.json({ error: { message: "Project not found" } }, { status: 404 });
  }
  const { data, error } = await supabase
    .from("projects")
    .select("id, roadmap")
    .eq("id", params.id)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: { message: "Project not found" } }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const action = typeof body?.action === "string" ? body.action : "";
  const payload = body?.payload && typeof body.payload === "object" ? body.payload : {};

  const result = applyAction(data.roadmap as Roadmap, action, payload);
  if (!result.ok) {
    return NextResponse.json(
      { error: { message: result.error.message } },
      { status: result.error.status }
    );
  }

  const { error: updateError } = await supabase
    .from("projects")
    .update({ roadmap: result.roadmap })
    .eq("id", params.id);
  if (updateError) {
    return NextResponse.json({ error: { message: updateError.message } }, { status: 500 });
  }
  return NextResponse.json({ data: { roadmap: result.roadmap } });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { supabase, user } = await getAuthedClient();
  if (!user) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }
  if (!UUID_RE.test(params.id)) {
    return NextResponse.json({ error: { message: "Project not found" } }, { status: 404 });
  }
  const { error } = await supabase.from("projects").delete().eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
