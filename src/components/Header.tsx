"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

export default function Header() {
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
          <Link href="/build" className="btn-ghost">
            Build Mode
          </Link>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="btn-ghost">
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
