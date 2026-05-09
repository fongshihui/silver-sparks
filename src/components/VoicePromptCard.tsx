"use client";

import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { mergeProfile } from "@/lib/localProfile";
import { useTtsPlayer } from "@/hooks/useTtsPlayer";
import { useEffect, useMemo, useRef, useState } from "react";

type SttResult = {
  text?: string;
  transcript?: string;
  [k: string]: unknown;
};

function pickTranscript(result: SttResult | null): string {
  if (!result) return "";
  if (typeof result.text === "string") return result.text;
  if (typeof result.transcript === "string") return result.transcript;
  return "";
}

export function VoicePromptCard({
  promptId,
  prompt,
  existingAnswer,
  onAnswer,
}: {
  promptId: string;
  prompt: string;
  existingAnswer?: string;
  onAnswer: (text: string) => void;
}) {
  const [status, setStatus] = useState<
    "idle" | "recording" | "processing" | "ready"
  >(existingAnswer ? "ready" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [result, setResult] = useState<SttResult | null>(null);
  const [draft, setDraft] = useState(existingAnswer ?? "");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const canRecord = useMemo(() => status === "idle" || status === "ready", [
    status,
  ]);
  const canStop = useMemo(() => status === "recording", [status]);
  const transcript = pickTranscript(result);
  const { play: speakPrompt, isPlaying: isSpeaking } = useTtsPlayer();

  async function startRecording() {
    if (!canRecord) return;
    setError(null);
    setResult(null);
    setDraft(existingAnswer ?? "");

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
      fd.append("file", blob, "recording.webm");

      const res = await fetch("/api/elevenlabs/stt", { method: "POST", body: fd });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || "Transcription failed.");
      }
      const json = (await res.json()) as SttResult;
      setResult(json);
      const t = pickTranscript(json);
      setDraft(t);
      setStatus("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStatus("ready");
    }
  }

  function acceptAnswer() {
    const text = draft.trim();
    if (!text) return;
    mergeProfile({ voiceAnswers: { [promptId]: text } });
    onAnswer(text);
  }

  return (
    <Card>
      <div className="text-base font-semibold text-zinc-500 dark:text-zinc-400">
        Speak your answer
      </div>
      <div className="mt-2 text-2xl font-extrabold leading-snug tracking-tight">
        {prompt}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <PrimaryButton
          type="button"
          size="xl"
          variant="secondary"
          onClick={() => speakPrompt(prompt)}
          disabled={isSpeaking}
        >
          Read question aloud
        </PrimaryButton>
        <PrimaryButton
          type="button"
          size="xl"
          onClick={startRecording}
          disabled={!canRecord}
          variant="primary"
        >
          {status === "recording" ? "Recording…" : "Start recording"}
        </PrimaryButton>

        <PrimaryButton
          type="button"
          size="xl"
          onClick={stopRecordingAndTranscribe}
          disabled={!canStop}
          variant="danger"
        >
          Stop + transcribe
        </PrimaryButton>
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
                : "review"}
        </span>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl bg-red-50 p-4 text-lg font-semibold text-red-800 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900/60">
          {error}
        </div>
      ) : null}

      {audioUrl ? <audio className="mt-4 w-full" controls src={audioUrl} /> : null}

      <div className="mt-4">
        <label className="block text-lg font-semibold" htmlFor={`ans-${promptId}`}>
          Transcript
        </label>
        <textarea
          id={`ans-${promptId}`}
          className="mt-2 w-full resize-y rounded-2xl bg-zinc-50 p-4 text-lg ring-1 ring-zinc-200 focus:outline-none focus:ring-4 focus:ring-[var(--accent-ring)] dark:bg-zinc-950 dark:ring-zinc-800"
          rows={4}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Your words will appear here."
        />
        {transcript && transcript !== draft ? (
          <div className="mt-2 text-base font-semibold text-zinc-600 dark:text-zinc-300">
            You can edit the transcript before saving.
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex justify-end">
        <PrimaryButton
          type="button"
          size="lg"
          variant="secondary"
          onClick={acceptAnswer}
          disabled={draft.trim().length === 0}
        >
          Use this answer
        </PrimaryButton>
      </div>
    </Card>
  );
}

