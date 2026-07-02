import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { convertRoadmapMd } from "@/lib/roadmap-md";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const markdown = typeof body?.markdown === "string" ? body.markdown : "";
  if (!markdown.trim()) {
    return NextResponse.json(
      { error: { message: "Request body must contain non-empty 'markdown'" } },
      { status: 400 }
    );
  }
  if (markdown.length > 1_000_000) {
    return NextResponse.json(
      { error: { message: "Markdown file too large (max 1MB)" } },
      { status: 413 }
    );
  }

  const result = convertRoadmapMd(markdown);
  if (!result.ok) {
    return NextResponse.json(
      {
        error: {
          message: "Markdown violates the strict roadmap format — fix the markdown, never the JSON",
          details: result.errors,
        },
      },
      { status: 422 }
    );
  }
  return NextResponse.json({ data: { roadmap: result.roadmap } });
}
