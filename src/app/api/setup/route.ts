import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function userCount(): Promise<number> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (error) throw new Error(error.message);
  return data.total ?? data.users.length;
}

export async function GET() {
  try {
    const count = await userCount();
    return NextResponse.json({ needsSetup: count === 0 });
  } catch (err) {
    return NextResponse.json(
      { error: { message: err instanceof Error ? err.message : "Setup check failed" } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const count = await userCount();
    if (count > 0) {
      return NextResponse.json(
        { error: { code: "REGISTRATION_CLOSED", message: "Registration is closed" } },
        { status: 403 }
      );
    }
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "A valid email is required" } },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Password must be at least 8 characters" } },
        { status: 400 }
      );
    }
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) {
      return NextResponse.json({ error: { message: error.message } }, { status: 400 });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: { message: err instanceof Error ? err.message : "Setup failed" } },
      { status: 500 }
    );
  }
}
