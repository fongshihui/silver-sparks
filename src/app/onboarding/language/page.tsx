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
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight">
            Silver Sparks
          </h2>
          <p className="mt-4 text-center text-lg text-zinc-600 dark:text-zinc-300">
            A calm, step-by-step sign-up for adults 55+. You can use your voice for most
            questions. Which language feels most comfortable?
          </p>

          <div className="mt-8 flex flex-col gap-3">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => selectLanguage(lang.code)}
                className="w-full rounded-2xl text-left ring-1 ring-zinc-200 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-ring)] dark:ring-zinc-800 dark:hover:bg-zinc-900"
              >
                <span className="block p-5 text-xl font-semibold">{lang.name}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
