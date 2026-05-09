"use client";

import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { isValidEmail, logIn } from "@/lib/auth";
import { isOnboarded, loadProfile } from "@/lib/localProfile";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function clearErrorAnd<T>(setter: (value: T) => void) {
    return (value: T) => {
      if (error) setError(null);
      setter(value);
    };
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    if (!isValidEmail(email)) {
      setError("Please enter a valid email — it should include an @ symbol.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setSubmitting(true);
    const result = await logIn(email, password);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    const profile = loadProfile();
    if (isOnboarded(profile)) {
      router.push("/");
    } else if (profile?.language) {
      router.push("/onboarding/voice/1");
    } else {
      router.push("/onboarding/language");
    }
  }

  const emailLooksValid = email.length === 0 || isValidEmail(email);

  return (
    <AppShell
      title="Welcome back"
      subtitle="Log in with the email and password you used to sign up on this device."
    >
      <div className="mx-auto w-full max-w-xl">
        <Card>
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <div>
              <label
                htmlFor="email"
                className="block text-base font-semibold text-[var(--foreground)]"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={email}
                onChange={(e) => clearErrorAnd(setEmail)(e.target.value)}
                placeholder="you@example.com"
                aria-invalid={!emailLooksValid}
                aria-describedby="email-help"
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:border-[var(--accent)] transition-colors"
                required
              />
              {!emailLooksValid && (
                <p
                  id="email-help"
                  className="mt-2 text-sm font-semibold text-rose-700 dark:text-rose-300"
                >
                  Email must include an @ symbol, like name@example.com.
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-base font-semibold text-[var(--foreground)]"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-sm font-semibold text-[var(--accent)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)] rounded"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => clearErrorAnd(setPassword)(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:border-[var(--accent)] transition-colors"
                required
              />
            </div>

            {error ? (
              <div
                role="alert"
                className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-base font-semibold text-rose-800 dark:border-rose-700 dark:bg-rose-950/30 dark:text-rose-200"
              >
                {error}
              </div>
            ) : null}

            <PrimaryButton size="xl" type="submit" disabled={submitting}>
              {submitting ? "Logging in…" : "Log in"}
            </PrimaryButton>

            <p className="text-center text-base text-[var(--foreground-muted)]">
              New to JomPaktor?{" "}
              <Link
                href="/signup"
                className="font-semibold text-[var(--accent)] underline underline-offset-4"
              >
                Create an account
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
