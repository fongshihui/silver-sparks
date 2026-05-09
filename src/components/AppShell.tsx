"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isOnboarded, loadProfile } from "@/lib/localProfile";
import { useState } from "react";
import { VoiceModeToggle } from "@/components/VoiceModeToggle";

function NavLink({
  href,
  label,
  isActive,
}: {
  href: string;
  label: string;
  isActive: (pathname: string) => boolean;
}) {
  const pathname = usePathname();
  const active = isActive(pathname);
  return (
    <Link
      href={href}
      className={[
        "rounded-xl px-4 py-3 text-lg font-semibold",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-ring)]",
        active
          ? "bg-[var(--accent)] text-white"
          : "bg-white text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-50 dark:ring-zinc-800 dark:hover:bg-zinc-800",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  );
}

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  const [onboarded] = useState(() => isOnboarded(loadProfile()));

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
        <div className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                Silver Sparks
              </div>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{title}</h1>
              {subtitle ? (
                <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-300">{subtitle}</p>
              ) : null}
              <div className="mt-4">
                <VoiceModeToggle
                  label="Read page title and subtitle"
                  speakText={`${title}. ${subtitle ?? ""}`}
                />
              </div>
            </div>
            {onboarded ? (
              <nav className="flex flex-wrap gap-3" aria-label="Primary">
                <NavLink
                  href="/"
                  label="Matches"
                  isActive={(p) => p === "/"}
                />
                <NavLink
                  href="/chats"
                  label="Chats"
                  isActive={(p) => p === "/chats" || p.startsWith("/chat/")}
                />
                <NavLink
                  href="/profile"
                  label="My profile"
                  isActive={(p) => p.startsWith("/profile")}
                />
              </nav>
            ) : null}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">{children}</div>
      </main>
      <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto w-full max-w-4xl px-4 py-5 text-sm text-zinc-500 dark:text-zinc-400 sm:px-6">
          Demo for seniors — large type, voice help, and safety cues. Not a live dating
          service.
        </div>
      </footer>
    </div>
  );
}
