"use client";

import { AppShell } from "@/components/AppShell";
import { BottomBarCTA } from "@/components/ui/BottomBarCTA";
import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { loadProfile, mergeProfile } from "@/lib/localProfile";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function SelfieStepPage() {
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(() => {
    const p = loadProfile();
    return p?.selfieDataUrl ?? null;
  });
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(() => {
    const p = loadProfile();
    return p?.avatarDataUrl ?? null;
  });
  const [customization, setCustomization] = useState(
    "Pixar-style, friendly smile, warm lighting, clean background",
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = useMemo(
    () => Boolean(avatarDataUrl || selfieDataUrl),
    [avatarDataUrl, selfieDataUrl],
  );

  function onFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === "string" ? reader.result : null;
      if (!url) return;
      setSelfieDataUrl(url);
      mergeProfile({ selfieDataUrl: url });
    };
    reader.readAsDataURL(file);
  }

  async function generateAvatar() {
    if (!selfieDataUrl) {
      setError("Upload a face photo first.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const blob = await (await fetch(selfieDataUrl)).blob();
      const fd = new FormData();
      fd.append("file", blob, "face.png");
      fd.append("style", "pixar");
      fd.append("customization", customization);

      const res = await fetch("/api/openai/avatar", { method: "POST", body: fd });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Avatar generation failed.");
      }
      const json = (await res.json()) as {
        data?: Array<{ b64_json?: string }>;
      };
      const b64 = json.data?.[0]?.b64_json;
      if (!b64) throw new Error("Avatar response missing image data.");
      const url = `data:image/png;base64,${b64}`;
      setAvatarDataUrl(url);
      mergeProfile({ avatarDataUrl: url });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <AppShell
      title="Set up your profile"
      subtitle="Step 1 of 3 — Create your avatar."
    >
      <div className="grid gap-4">
        <Card>
          <ProgressDots total={3} activeIndex={0} />
          <div className="mt-4 text-2xl font-extrabold tracking-tight">
            Upload your face photo
          </div>
          <p className="mt-2 text-lg text-zinc-700 dark:text-zinc-200">
            We’ll use it to generate a friendly avatar. You can edit the result.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 sm:items-start">
            <div className="rounded-3xl bg-zinc-50 p-4 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
              <label className="block text-lg font-semibold" htmlFor="selfie">
                Upload a photo
              </label>
              <input
                id="selfie"
                type="file"
                accept="image/*"
                capture="user"
                className="mt-3 block w-full text-lg"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
              <p className="mt-3 text-base font-semibold text-zinc-600 dark:text-zinc-300">
                Tip: On mobile, this can open the front camera.
              </p>

              <div className="mt-4">
                <label
                  className="block text-lg font-semibold"
                  htmlFor="custom"
                >
                  Avatar style (optional)
                </label>
                <textarea
                  id="custom"
                  className="mt-2 w-full resize-y rounded-2xl bg-white p-4 text-lg ring-1 ring-zinc-200 focus:outline-none focus:ring-4 focus:ring-[var(--accent-ring)] dark:bg-zinc-900 dark:ring-zinc-800"
                  rows={3}
                  value={customization}
                  onChange={(e) => setCustomization(e.target.value)}
                />
              </div>

              <div className="mt-4">
                <PrimaryButton
                  type="button"
                  size="xl"
                  disabled={!selfieDataUrl || isGenerating}
                  onClick={generateAvatar}
                >
                  {isGenerating ? "Generating…" : "Generate avatar"}
                </PrimaryButton>
              </div>

              {error ? (
                <div className="mt-4 rounded-2xl bg-red-50 p-4 text-lg font-semibold text-red-800 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900/60">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl bg-zinc-50 p-4 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
              <div className="text-lg font-semibold">Avatar preview</div>
              {avatarDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt="Your generated avatar"
                  src={avatarDataUrl}
                  className="mt-3 aspect-square w-full rounded-3xl object-cover ring-1 ring-zinc-200 dark:ring-zinc-800"
                />
              ) : selfieDataUrl ? (
                <div className="mt-3 grid gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Your uploaded face photo"
                    src={selfieDataUrl}
                    className="aspect-square w-full rounded-3xl object-cover ring-1 ring-zinc-200 dark:ring-zinc-800"
                  />
                  <div className="text-base font-semibold text-zinc-600 dark:text-zinc-300">
                    Upload looks good — tap “Generate avatar”.
                  </div>
                </div>
              ) : (
                <div className="mt-3 grid aspect-square place-items-center rounded-3xl bg-white text-lg font-semibold text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800">
                  No avatar yet
                </div>
              )}
            </div>
          </div>
        </Card>

        <BottomBarCTA>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/"
              className="text-lg font-semibold text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-300"
            >
              Back to matches
            </Link>
            <Link
              aria-disabled={!canContinue}
              tabIndex={canContinue ? 0 : -1}
              href={canContinue ? "/onboarding/profile" : "#"}
              className={canContinue ? "" : "pointer-events-none opacity-60"}
            >
              <PrimaryButton size="xl" disabled={!canContinue}>
                Continue
              </PrimaryButton>
            </Link>
          </div>
        </BottomBarCTA>
      </div>
    </AppShell>
  );
}

