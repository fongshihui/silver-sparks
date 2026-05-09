"use client";

import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import {
  MIN_PASSWORD_LENGTH,
  isValidEmail,
  signUp,
  validatePassword,
} from "@/lib/auth";
import { isOnboarded, loadProfile } from "@/lib/localProfile";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
    const pwError = validatePassword(password);
    if (pwError) {
      setError(pwError.message);
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match. Please re-type them.");
      return;
    }

    setSubmitting(true);
    const result = await signUp(email, password);
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
  const passwordLongEnough =
    password.length === 0 || password.length >= MIN_PASSWORD_LENGTH;
  const confirmMatches = confirm.length === 0 || confirm === password;

  return (
    <AppShell
      title="Create your account"
      subtitle="Use your email and a password you'll remember. Then we'll set up your profile."
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
              <p
                id="email-help"
                className={[
                  "mt-2 text-sm",
                  emailLooksValid
                    ? "text-[var(--foreground-muted)]"
                    : "text-rose-700 dark:text-rose-300 font-semibold",
                ].join(" ")}
              >
                {emailLooksValid
                  ? "We use this so you can log back in on this device."
                  : "Email must include an @ symbol, like name@example.com."}
              </p>
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
                autoComplete="new-password"
                value={password}
                onChange={(e) => clearErrorAnd(setPassword)(e.target.value)}
                aria-invalid={!passwordLongEnough}
                aria-describedby="password-help"
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:border-[var(--accent)] transition-colors"
                required
                minLength={MIN_PASSWORD_LENGTH}
              />
              <p
                id="password-help"
                className={[
                  "mt-2 text-sm",
                  passwordLongEnough
                    ? "text-[var(--foreground-muted)]"
                    : "text-rose-700 dark:text-rose-300 font-semibold",
                ].join(" ")}
              >
                At least {MIN_PASSWORD_LENGTH} characters. Use something easy
                for you to remember.
              </p>
            </div>

            <div>
              <label
                htmlFor="confirm"
                className="block text-base font-semibold text-[var(--foreground)]"
              >
                Confirm password
              </label>
              <input
                id="confirm"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => clearErrorAnd(setConfirm)(e.target.value)}
                aria-invalid={!confirmMatches}
                aria-describedby="confirm-help"
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:border-[var(--accent)] transition-colors"
                required
                minLength={MIN_PASSWORD_LENGTH}
              />
              <p
                id="confirm-help"
                className={[
                  "mt-2 text-sm",
                  confirmMatches
                    ? "text-[var(--foreground-muted)]"
                    : "text-rose-700 dark:text-rose-300 font-semibold",
                ].join(" ")}
              >
                {confirmMatches
                  ? "Type your password again so we know it's right."
                  : "The two passwords don't match yet."}
              </p>
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
              {submitting ? "Creating your account…" : "Create account"}
            </PrimaryButton>

            <p className="text-center text-base text-[var(--foreground-muted)]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-[var(--accent)] underline underline-offset-4"
              >
                Log in
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
