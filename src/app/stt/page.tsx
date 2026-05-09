"use client";

import { AppShell } from "@/components/AppShell";
import { useEffect, useMemo, useRef, useState } from "react";

type SttResult = {
  text?: string;
  transcript?: string;
  transcripts?: Record<string, unknown>;
  [k: string]: unknown;
};

function pickTranscript(result: SttResult | null): string {
  if (!result) return "";
  if (typeof result.text === "string") return result.text;
  if (typeof result.transcript === "string") return result.transcript;
  return "";
}

export default function SttPage() {
  const [status, setStatus] = useState<
    "idle" | "recording" | "processing" | "done"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [result, setResult] = useState<SttResult | null>(null);
  const [languageCode, setLanguageCode] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const canRecord = useMemo(() => status === "idle" || status === "done", [
    status,
  ]);
  const canStop = useMemo(() => status === "recording", [status]);

  async function startRecording() {
    if (!canRecord) return;
    setError(null);
    setResult(null);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
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

    setStatus("recording");
    recorder.start();
  }

  async function stopRecordingAndTranscribe() {
    if (!canStop) return;
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    setStatus("processing");
    setError(null);

    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        resolve(new Blob(chunksRef.current, { type: recorder.mimeType }));
      };
      recorder.stop();
    });

    const nextUrl = URL.createObjectURL(blob);
    setAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return nextUrl;
    });

    try {
      const fd = new FormData();
      fd.append("model_id", "scribe_v2");
      if (languageCode.trim()) fd.append("language_code", languageCode.trim());
      fd.append("file", blob, "recording.webm");

      const res = await fetch("/api/elevenlabs/stt", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || "Transcription failed.");
      }

      const json = (await res.json()) as SttResult;
      setResult(json);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStatus("done");
    }
  }

  const transcript = pickTranscript(result);

  return (
    <AppShell
      title="Speech-to-text"
      subtitle="Record your voice and get a transcript (ElevenLabs STT)."
    >
      <div className="grid gap-4">
        <section className="rounded-2xl bg-white p-5 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          <div className="text-lg font-semibold">Recording</div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={startRecording}
              disabled={!canRecord}
              className={[
                "rounded-2xl px-5 py-5 text-xl font-extrabold text-white",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30",
                canRecord ? "bg-blue-600 hover:bg-blue-700" : "bg-zinc-400",
              ].join(" ")}
            >
              {status === "recording" ? "Recording…" : "Start recording"}
            </button>

            <button
              type="button"
              onClick={stopRecordingAndTranscribe}
              disabled={!canStop}
              className={[
                "rounded-2xl px-5 py-5 text-xl font-extrabold text-white",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30",
                canStop ? "bg-rose-600 hover:bg-rose-700" : "bg-zinc-400",
              ].join(" ")}
            >
              Stop + transcribe
            </button>

            <div className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
              <label
                className="block text-base font-semibold text-zinc-600 dark:text-zinc-300"
                htmlFor="language"
              >
                Language (optional)
              </label>
              <input
                id="language"
                className="mt-2 w-full rounded-xl bg-white px-4 py-3 text-lg text-zinc-900 ring-1 ring-zinc-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:bg-zinc-900 dark:text-zinc-50 dark:ring-zinc-800"
                placeholder="e.g. en, tl, zh"
                value={languageCode}
                onChange={(e) => setLanguageCode(e.target.value)}
              />
              <div className="mt-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                Leave blank to auto-detect.
              </div>
            </div>
          </div>

          <div className="mt-4 text-lg font-semibold text-zinc-700 dark:text-zinc-200">
            Status:{" "}
            <span className="font-mono">
              {status === "idle"
                ? "ready"
                : status === "recording"
                  ? "recording"
                  : status === "processing"
                    ? "transcribing…"
                    : "done"}
            </span>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl bg-red-50 p-4 text-lg font-semibold text-red-800 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900/60">
              {error}
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl bg-white p-5 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          <div className="text-lg font-semibold">Playback</div>
          {audioUrl ? (
            <audio className="mt-3 w-full" controls src={audioUrl} />
          ) : (
            <p className="mt-2 text-lg text-zinc-700 dark:text-zinc-200">
              Record audio to preview it here.
            </p>
          )}
        </section>

        <section className="rounded-2xl bg-white p-5 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          <div className="text-lg font-semibold">Transcript</div>
          {transcript ? (
            <div className="mt-3 rounded-2xl bg-zinc-50 p-5 text-2xl font-extrabold leading-snug text-zinc-900 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:text-zinc-50 dark:ring-zinc-800">
              {transcript}
            </div>
          ) : (
            <p className="mt-2 text-lg text-zinc-700 dark:text-zinc-200">
              Your transcript will show up here after transcription.
            </p>
          )}
        </section>
      </div>
    </AppShell>
  );
}

