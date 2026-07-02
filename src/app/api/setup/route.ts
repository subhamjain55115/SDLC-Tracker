import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongodb";
import User from "@/lib/models/User";

export const dynamic = "force-dynamic";

export async function GET() {
  await dbConnect();
  const count = await User.countDocuments();
  return NextResponse.json({ needsSetup: count === 0 });
}

export async function POST(request: Request) {
  await dbConnect();
  const count = await User.countDocuments();
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
  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ email, passwordHash });
  return NextResponse.json({ ok: true }, { status: 201 });
}
