"use client";

import { AppShell } from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";

export default function VoiceDemoPage() {
  const [text, setText] = useState(
    "Hi! This is a quick voice read-aloud demo using ElevenLabs.",
  );
  const [voiceId, setVoiceId] = useState("");
  const [modelId, setModelId] = useState("eleven_v3");
  const [outputFormat, setOutputFormat] = useState("mp3_44100_128");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const canSubmit = useMemo(() => text.trim().length > 0 && !isLoading, [
    text,
    isLoading,
  ]);

  async function onGenerate() {
    if (!canSubmit) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/elevenlabs/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text,
          voiceId: voiceId.trim() ? voiceId.trim() : undefined,
          modelId: modelId.trim() ? modelId.trim() : undefined,
          outputFormat: outputFormat.trim() ? outputFormat.trim() : undefined,
        }),
      });

      if (!res.ok) {
        const maybeJson = await res
          .json()
          .catch(() => ({ error: "Request failed." }));
        throw new Error(maybeJson?.error || "Request failed.");
      }

      const blob = await res.blob();
      const nextUrl = URL.createObjectURL(blob);
      setAudioUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return nextUrl;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AppShell
      title="Voice demo"
      subtitle="Generate speech from text via ElevenLabs (server-side API call)."
    >
      <div className="grid gap-4">
        <section className="rounded-2xl bg-white p-5 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          <label className="block text-lg font-semibold" htmlFor="voice-text">
            Text to read aloud
          </label>
          <textarea
            id="voice-text"
            className="mt-2 w-full resize-y rounded-xl bg-zinc-50 p-4 text-lg text-zinc-900 ring-1 ring-zinc-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:bg-zinc-950 dark:text-zinc-50 dark:ring-zinc-800"
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="mt-4 grid gap-3 sm:grid-cols-3 sm:items-end">
            <div className="sm:col-span-2">
              <label
                className="block text-lg font-semibold"
                htmlFor="voice-id"
              >
                Voice ID (optional)
              </label>
              <input
                id="voice-id"
                className="mt-2 w-full rounded-xl bg-zinc-50 px-4 py-3 text-lg text-zinc-900 ring-1 ring-zinc-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:bg-zinc-950 dark:text-zinc-50 dark:ring-zinc-800"
                placeholder="Leave blank to use ELEVENLABS_VOICE_ID (or default)"
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={onGenerate}
              disabled={!canSubmit}
              className={[
                "rounded-xl px-4 py-3 text-lg font-extrabold text-white",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30",
                canSubmit ? "bg-blue-600 hover:bg-blue-700" : "bg-zinc-400",
              ].join(" ")}
            >
              {isLoading ? "Generating…" : "Generate voice"}
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-lg font-semibold" htmlFor="model-id">
                Model ID
              </label>
              <input
                id="model-id"
                className="mt-2 w-full rounded-xl bg-zinc-50 px-4 py-3 text-lg text-zinc-900 ring-1 ring-zinc-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:bg-zinc-950 dark:text-zinc-50 dark:ring-zinc-800"
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                placeholder="eleven_v3"
              />
              <p className="mt-2 text-base font-semibold text-zinc-600 dark:text-zinc-300">
                Default: <span className="font-mono">eleven_v3</span>
              </p>
            </div>

            <div>
              <label
                className="block text-lg font-semibold"
                htmlFor="output-format"
              >
                Output format
              </label>
              <select
                id="output-format"
                className="mt-2 w-full rounded-xl bg-zinc-50 px-4 py-3 text-lg text-zinc-900 ring-1 ring-zinc-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:bg-zinc-950 dark:text-zinc-50 dark:ring-zinc-800"
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
              >
                <option value="mp3_44100_128">mp3_44100_128</option>
                <option value="mp3_44100_192">mp3_44100_192</option>
                <option value="pcm_44100">pcm_44100</option>
              </select>
              <p className="mt-2 text-base font-semibold text-zinc-600 dark:text-zinc-300">
                Sent as <span className="font-mono">output_format</span> query
                param.
              </p>
            </div>
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
              Generate audio to preview it here.
            </p>
          )}
        </section>
      </div>
    </AppShell>
  );
}

