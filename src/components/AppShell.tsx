"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { isAuthenticated, logOut } from "@/lib/auth";
import { isOnboarded, loadProfile } from "@/lib/localProfile";
import { useState } from "react";
import { VoiceModeToggle } from "@/components/VoiceModeToggle";

/* Pinwheel-style logo mark */
function PinwheelMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <path d="M13 1 C13 1 19 7 19 13 C19 19 13 25 13 25 C13 25 7 19 7 13 C7 7 13 1 13 1Z" fill="var(--accent)" opacity="0.9"/>
      <path d="M1 13 C1 13 7 7 13 7 C19 7 25 13 25 13 C25 13 19 19 13 19 C7 19 1 13 1 13Z" fill="var(--accent-secondary)" opacity="0.7"/>
      <circle cx="13" cy="13" r="2.8" fill="white"/>
    </svg>
  );
}

function NavLink({
  href,
  label,
  isActive,
}: {
  href: string;
  label: string;
  /** When set, overrides default active detection (e.g. `/chat/[id]` belongs under Chats). */
  isActive?: (pathname: string) => boolean;
}) {
  const pathname = usePathname();
  const active = isActive
    ? isActive(pathname)
    : pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={[
        "relative px-3 py-1.5 text-[15px] font-semibold rounded-lg transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]",
        active
          ? "text-[var(--accent)]"
          : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
    >
      {label}
      {active && (
        <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-[var(--accent)]" />
      )}
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
  const router = useRouter();
  const [onboarded] = useState(() => isOnboarded(loadProfile()));
  const [authed] = useState(() => isAuthenticated());

  function handleLogOut() {
    logOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="min-h-full flex flex-col bg-[var(--background)]">
      {/* Pinwheel sticky navbar */}
      <header
        className="sticky top-0 z-50 border-b border-[var(--nav-border)]"
        style={{
          background: "var(--nav-bg)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Brand */}
            <Link
              href="/"
              className="flex items-center gap-2 shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
            >
              <PinwheelMark />
              <span
                className="text-[17px] font-extrabold tracking-tight text-[var(--foreground)]"
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
              >
                JomPaktor
              </span>
            </Link>

            {/* Desktop nav links */}
            {onboarded && (
              <nav className="hidden sm:flex items-center gap-1" aria-label="Primary">
                <NavLink href="/" label="Match" />
                <NavLink
                  href="/chats"
                  label="Chats"
                  isActive={(p) => p === "/chats" || p.startsWith("/chat/")}
                />
                <NavLink href="/profile" label="My Profile" />
              </nav>
            )}

            {/* Right side */}
            <div className="flex items-center gap-3 shrink-0">
              <VoiceModeToggle
                label="Read page aloud"
                speakText={`${title}. ${subtitle ?? ""}`}
              />
              {authed ? (
                <button
                  type="button"
                  onClick={handleLogOut}
                  className="hidden sm:inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold border border-[var(--accent)] text-[var(--accent)] hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                >
                  Log out
                </button>
              ) : (
                <Link
                  href="/login"
                  className="hidden sm:inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold border border-[var(--accent)] text-[var(--accent)] hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                >
                  Log in
                </Link>
              )}
            </div>
          </div>

          {/* Mobile nav */}
          {(onboarded || authed) && (
            <nav className="flex sm:hidden items-center justify-between gap-1 pb-2" aria-label="Primary mobile">
              {onboarded ? (
                <div className="flex items-center gap-1 overflow-x-auto">
                  <NavLink href="/" label="Matches" />
                  <NavLink
                    href="/chats"
                    label="Chats"
                    isActive={(p) => p === "/chats" || p.startsWith("/chat/")}
                  />
                  <NavLink href="/profile" label="Profile" />
                </div>
              ) : (
                <span className="text-sm font-semibold text-[var(--foreground-muted)]">
                  Setting up your profile…
                </span>
              )}
              {authed && (
                <button
                  type="button"
                  onClick={handleLogOut}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-[var(--accent)] hover:bg-orange-50 dark:hover:bg-orange-950/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                >
                  Log out
                </button>
              )}
            </nav>
          )}
        </div>
      </header>

      {/* Page title area */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--surface)]">
        <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6">
          <h1
            className="text-2xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-3xl"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-base text-[var(--foreground-muted)]">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Main */}
      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <PinwheelMark />
            <span
              className="text-sm font-bold text-[var(--foreground)]"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              JomPaktor
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

