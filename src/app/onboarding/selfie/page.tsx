"use client";

import { AppShell } from "@/components/AppShell";
import { BottomBarCTA } from "@/components/ui/BottomBarCTA";
import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { loadProfile, mergeProfile } from "@/lib/localProfile";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function SelfieStepPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(() => {
    const p = loadProfile();
    return p?.selfieDataUrl ?? null;
  });
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(() => {
    const p = loadProfile();
    return p?.avatarDataUrl ?? null;
  });
  const [customization, setCustomization] = useState(
    "Friendly illustrated portrait, warm smile, soft lighting, simple background",
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    const s = streamRef.current;
    if (s) {
      for (const t of s.getTracks()) t.stop();
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 1280, height: 720 },
          audio: false,
        });
        if (cancelled) {
          for (const t of stream.getTracks()) t.stop();
          return;
        }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          await v.play().catch(() => {});
        }
        setCameraError(null);
      } catch {
        if (!cancelled) {
          setCameraError(
            "We couldn’t open your camera automatically. You can still upload a photo below.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [stopCamera]);

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

  function captureFromCamera() {
    const v = videoRef.current;
    if (!v || v.videoWidth === 0) {
      setError("Wait for the camera preview, then try again.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    const url = canvas.toDataURL("image/jpeg", 0.92);
    setSelfieDataUrl(url);
    mergeProfile({ selfieDataUrl: url });
    setError(null);
  }

  async function generateAvatar() {
    if (!selfieDataUrl) {
      setError("Take or upload a face photo first.");
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
      title="Your photo"
      subtitle="Step 3 of 4 — We’ll turn this into a friendly avatar."
    >
      <div className="grid gap-4">
        <Card>
          <ProgressDots total={4} activeIndex={2} />
          <div className="mt-4 text-2xl font-extrabold tracking-tight">
            Take a quick selfie
          </div>
          <p className="mt-2 text-lg text-zinc-700 dark:text-zinc-200">
            Your camera opens on its own on most laptops and phones. When you’re ready,
            tap <span className="font-semibold">Use this photo</span>. You can also upload
            a picture instead.
          </p>

          <div className="mt-5 grid gap-4 lg:grid-cols-2 lg:items-start">
            <div className="rounded-3xl bg-zinc-50 p-4 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
              <div className="text-lg font-semibold">Camera</div>
              <div className="mt-3 overflow-hidden rounded-2xl bg-black ring-1 ring-zinc-800">
                <video
                  ref={videoRef}
                  className="aspect-[4/3] w-full object-cover"
                  playsInline
                  muted
                />
              </div>
              {cameraError ? (
                <p className="mt-2 text-base font-semibold text-amber-800 dark:text-amber-200">
                  {cameraError}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-3">
                <PrimaryButton type="button" size="lg" onClick={captureFromCamera}>
                  Use this photo
                </PrimaryButton>
              </div>

              <label className="mt-6 block text-lg font-semibold" htmlFor="selfie">
                Or upload a photo
              </label>
              <input
                id="selfie"
                type="file"
                accept="image/*"
                capture="user"
                className="mt-3 block w-full text-lg"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />

              <div className="mt-6">
                <label className="block text-lg font-semibold" htmlFor="custom">
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
                  {isGenerating ? "Generating…" : "Create cute avatar"}
                </PrimaryButton>
              </div>

              {error ? (
                <div className="mt-4 rounded-2xl bg-red-50 p-4 text-lg font-semibold text-red-800 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900/60">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl bg-zinc-50 p-4 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
              <div className="text-lg font-semibold">Preview</div>
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
                    alt="Photo you chose"
                    src={selfieDataUrl}
                    className="aspect-square w-full rounded-3xl object-cover ring-1 ring-zinc-200 dark:ring-zinc-800"
                  />
                  <div className="text-base font-semibold text-zinc-600 dark:text-zinc-300">
                    When it looks good, tap “Create cute avatar”.
                  </div>
                </div>
              ) : (
                <div className="mt-3 grid aspect-square place-items-center rounded-3xl bg-white text-lg font-semibold text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800">
                  No photo yet
                </div>
              )}
            </div>
          </div>
        </Card>

        <BottomBarCTA>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/onboarding/voice/2"
              className="text-lg font-semibold text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-300"
            >
              Back
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
