"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Header() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight text-white">
          SDLC <span className="text-indigo-400">Tracker</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/" className="btn-ghost">
            Projects
          </Link>
          <Link href="/quick-build" className="btn-ghost">
            Quick Build Mode
          </Link>
          <Link href="/build" className="btn-ghost">
            Manual Build Mode
          </Link>
          <button onClick={handleSignOut} className="btn-ghost">
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
