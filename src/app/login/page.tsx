"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/setup")
      .then((r) => r.json())
      .then((d) => setNeedsSetup(d.needsSetup === true))
      .catch(() => setNeedsSetup(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (needsSetup) {
        const res = await fetch("/api/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          setError(body?.error?.message ?? "Setup failed");
          setBusy(false);
          return;
        }
      }
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError("Invalid email or password");
        setBusy(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong — check the server is running");
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-bold text-white">
          SDLC <span className="text-indigo-400">Tracker</span>
        </h1>
        <p className="mb-6 text-center text-sm text-slate-400">
          {needsSetup === null
            ? "Checking..."
            : needsSetup
              ? "First-time setup — create your account"
              : "Sign in to continue"}
        </p>
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="password" className="label">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={needsSetup ? 8 : undefined}
              autoComplete={needsSetup ? "new-password" : "current-password"}
            />
            {needsSetup && (
              <p className="mt-1 text-xs text-slate-500">Minimum 8 characters</p>
            )}
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={busy || needsSetup === null}>
            {busy ? "Please wait..." : needsSetup ? "Create account & sign in" : "Sign in"}
          </button>
          {needsSetup && (
            <p className="text-xs text-slate-500">
              This is a single-user app. After this account is created, registration closes
              permanently.
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
