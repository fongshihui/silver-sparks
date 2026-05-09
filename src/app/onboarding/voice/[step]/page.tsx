"use client";

import { AppShell } from "@/components/AppShell";
import { BottomBarCTA } from "@/components/ui/BottomBarCTA";
import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { mergeProfile } from "@/lib/localProfile";
import { loadVoicePrefs } from "@/lib/voicePrefs";
import { useSilenceStopRecorder } from "@/hooks/useSilenceStopRecorder";
import { useTtsPlayer } from "@/hooks/useTtsPlayer";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

const prompts = [
  { id: "q1", text: "What are you hoping to find on Silver Sparks?" },
  { id: "q2", text: "What do you enjoy doing on a relaxed weekend?" },
  { id: "q3", text: "What’s one small thing that makes you feel cared for?" },
];

function clampStep(raw: string) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(prompts.length, Math.floor(n)));
}

export default function VoiceStepWizardPage({
  params,
}: {
  params: { step: string };
}) {
  const step = clampStep(params.step);
  const idx = step - 1;
  const prompt = prompts[idx];
  const nextHref = step < prompts.length ? `/onboarding/voice/${step + 1}` : "/onboarding/done";

  const voicePrefs = useMemo(() => loadVoicePrefs(), []);
  const { play } = useTtsPlayer();
  const { attach, cleanup } = useSilenceStopRecorder();

  const [mode, setMode] = useState<
    "ready" | "speaking" | "recording" | "processing" | "review"
  >("ready");
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [autoAdvanceIn, setAutoAdvanceIn] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const advanceTimerRef = useRef<number | null>(null);

  const canStart = mode === "ready";
  const canStop = mode === "recording";

  async function begin() {
    if (!canStart) return;
    setError(null);
    setDraft("");
    setAutoAdvanceIn(null);

    try {
      if (voicePrefs.enabled && voicePrefs.unlocked) {
        setMode("speaking");
        await play(prompt.text);
      }
    } catch {
      // ignore (still proceed to recording)
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setMode("ready");
      setError("Microphone permission is required to record.");
      return;
    }

    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      for (const t of stream.getTracks()) t.stop();
    };

    setMode("recording");
    recorder.start();

    await attach(stream, () => {
      stopAndTranscribe();
    });
  }

  async function stopAndTranscribe() {
    if (!canStop) return;
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    cleanup();

    setMode("processing");
    setError(null);

    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () =>
        resolve(new Blob(chunksRef.current, { type: recorder.mimeType }));
      recorder.stop();
    });

    try {
      const fd = new FormData();
      fd.append("model_id", "scribe_v2");
      fd.append("file", blob, "answer.webm");
      const res = await fetch("/api/elevenlabs/stt", { method: "POST", body: fd });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Transcription failed.");
      }
      const json = (await res.json()) as { text?: string; transcript?: string };
      const text = (json.text ?? json.transcript ?? "").trim();
      setDraft(text);
      setMode("review");

      // Auto-advance after 4 seconds unless user edits.
      let countdown = 4;
      setAutoAdvanceIn(countdown);
      if (advanceTimerRef.current) window.clearInterval(advanceTimerRef.current);
      advanceTimerRef.current = window.setInterval(() => {
        countdown -= 1;
        if (countdown <= 0) {
          window.clearInterval(advanceTimerRef.current!);
          advanceTimerRef.current = null;
          acceptAndContinue();
        } else {
          setAutoAdvanceIn(countdown);
        }
      }, 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setMode("ready");
    }
  }

  function cancelAutoAdvance() {
    if (advanceTimerRef.current) window.clearInterval(advanceTimerRef.current);
    advanceTimerRef.current = null;
    setAutoAdvanceIn(null);
  }

  function acceptAndContinue() {
    cancelAutoAdvance();
    const text = draft.trim();
    if (!text) return;
    mergeProfile({ voiceAnswers: { [prompt.id]: text } });
    // Navigation via Link click (simple, avoids router import).
    window.location.href = nextHref;
  }

  return (
    <AppShell
      title="Voice setup"
      subtitle={`Question ${step} of ${prompts.length} — Speak naturally. I’ll stop when you pause.`}
    >
      <div className="grid gap-4">
        <Card>
          <ProgressDots total={3} activeIndex={2} />
          <div className="mt-4 text-base font-semibold text-zinc-500 dark:text-zinc-400">
            Question {step} of {prompts.length}
          </div>
          <div className="mt-2 text-3xl font-extrabold leading-snug tracking-tight">
            {prompt.text}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <PrimaryButton
              type="button"
              size="xl"
              onClick={begin}
              disabled={!canStart}
            >
              {mode === "speaking"
                ? "Speaking…"
                : mode === "recording"
                  ? "Listening…"
                  : mode === "processing"
                    ? "Transcribing…"
                    : "Start"}
            </PrimaryButton>
            <PrimaryButton
              type="button"
              size="xl"
              variant="danger"
              onClick={stopAndTranscribe}
              disabled={!canStop}
            >
              Stop
            </PrimaryButton>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl bg-red-50 p-4 text-lg font-semibold text-red-800 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900/60">
              {error}
            </div>
          ) : null}
        </Card>

        <Card>
          <div className="text-lg font-semibold">Transcript (edit if needed)</div>
          <textarea
            className="mt-3 w-full resize-y rounded-2xl bg-zinc-50 p-4 text-xl font-semibold ring-1 ring-zinc-200 focus:outline-none focus:ring-4 focus:ring-[var(--accent-ring)] dark:bg-zinc-950 dark:ring-zinc-800"
            rows={5}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              cancelAutoAdvance();
            }}
            placeholder="Your words will appear here after you finish speaking."
          />
          {autoAdvanceIn !== null ? (
            <div className="mt-2 text-base font-semibold text-zinc-600 dark:text-zinc-300">
              Next question in <span className="font-mono">{autoAdvanceIn}</span>…
            </div>
          ) : null}
        </Card>

        <BottomBarCTA>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href={step === 1 ? "/onboarding/profile" : `/onboarding/voice/${step - 1}`}
              className="text-lg font-semibold text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-300"
            >
              Back
            </Link>
            <div className="flex flex-wrap gap-3">
              <Link href={nextHref}>
                <PrimaryButton
                  variant="secondary"
                  onClick={() => {
                    cancelAutoAdvance();
                    acceptAndContinue();
                  }}
                  disabled={draft.trim().length === 0}
                >
                  Next
                </PrimaryButton>
              </Link>
            </div>
          </div>
        </BottomBarCTA>
      </div>
    </AppShell>
  );
}

