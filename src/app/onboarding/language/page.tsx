"use client";

import { useRouter } from "next/navigation";
import { mergeProfile } from "@/lib/localProfile";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { ProgressDots } from "@/components/ui/ProgressDots";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "zh", name: "中文 (Chinese)" },
  { code: "tl", name: "Tagalog" },
  { code: "vi", name: "Tiếng Việt" },
];

export default function LanguagePage() {
  const router = useRouter();

  function selectLanguage(code: string) {
    mergeProfile({ language: code });
    router.push("/onboarding/voice/1");
  }

  return (
    <AppShell
      title="Welcome"
      subtitle="Step 1 of 4 — Pick the language for voice prompts and read-aloud."
    >
      <div className="grid gap-4">
        <Card className="p-6">
          <ProgressDots total={4} activeIndex={0} />
          <h2
            className="mt-6 text-center text-3xl font-extrabold tracking-tight text-[var(--foreground)]"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            Silver Sparks
          </h2>
          <p className="mt-4 text-center text-base text-[var(--foreground-muted)] leading-relaxed">
            A calm, step-by-step sign-up for adults 55+. You can use your voice for most
            questions. Which language feels most comfortable?
          </p>

          <div className="mt-8 flex flex-col gap-3">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => selectLanguage(lang.code)}
                className="w-full rounded-xl text-left border border-[var(--border)] bg-[var(--surface)] transition-all duration-150 hover:border-[var(--accent)] hover:bg-orange-50 dark:hover:bg-orange-950/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
              >
                <span
                  className="block px-5 py-4 text-base font-semibold text-[var(--foreground)]"
                  style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                >
                  {lang.name}
                </span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
