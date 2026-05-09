"use client";

import { AppShell } from "@/components/AppShell";
import { BottomBarCTA } from "@/components/ui/BottomBarCTA";
import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useTtsPlayer } from "@/hooks/useTtsPlayer";
import { sampleChats, sampleMatches } from "@/lib/sampleData";
import { useMemo, useRef, useState } from "react";

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function ChatPage({ params }: { params: { id: string } }) {
  const match = useMemo(
    () => sampleMatches.find((m) => m.id === params.id) ?? null,
    [params.id],
  );
  const initial = useMemo(() => sampleChats[params.id] ?? [], [params.id]);
  const [messages, setMessages] = useState(initial);
  const [draft, setDraft] = useState("");
  const { play } = useTtsPlayer();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [recStatus, setRecStatus] = useState<"idle" | "recording" | "processing">(
    "idle",
  );
  const canRecord = recStatus === "idle";
  const canStop = recStatus === "recording";

  async function startRecording() {
    if (!canRecord) return;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
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
    setRecStatus("recording");
    recorder.start();
  }

  async function stopAndTranscribe() {
    if (!canStop) return;
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    setRecStatus("processing");
    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunksRef.current, { type: recorder.mimeType }));
      recorder.stop();
    });

    try {
      const fd = new FormData();
      fd.append("model_id", "scribe_v2");
      fd.append("file", blob, "message.webm");
      const res = await fetch("/api/elevenlabs/stt", { method: "POST", body: fd });
      if (!res.ok) throw new Error("STT failed");
      const json = (await res.json()) as { text?: string; transcript?: string };
      const text = (json.text ?? json.transcript ?? "").trim();
      if (text) setDraft(text);
    } catch {
      // ignore (keep UI simple)
    } finally {
      setRecStatus("idle");
    }
  }

  function send() {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `me-${Date.now()}`,
        role: "me" as const,
        text,
        createdAtIso: new Date().toISOString(),
      },
    ]);
    setDraft("");
  }

  return (
    <AppShell
      title={match ? `Chat with ${match.name}` : "Chat"}
      subtitle="Tap Read aloud to listen. Use voice to reply."
    >
      <div className="grid gap-4">
        <Card>
          <div className="grid gap-3">
            {messages.map((m) => {
              const mine = m.role === "me";
              return (
                <div
                  key={m.id}
                  className={[
                    "rounded-3xl p-4 ring-1",
                    mine
                      ? "bg-rose-50 ring-rose-200 dark:bg-rose-950/20 dark:ring-rose-900/40"
                      : "bg-zinc-50 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-base font-semibold text-zinc-500 dark:text-zinc-400">
                        {mine ? "You" : match?.name ?? "Them"} · {formatTime(m.createdAtIso)}
                      </div>
                      <div className="mt-1 text-xl font-extrabold leading-snug">
                        {m.text}
                      </div>
                    </div>
                    <PrimaryButton
                      type="button"
                      variant="secondary"
                      onClick={() => play(m.text)}
                    >
                      Read aloud
                    </PrimaryButton>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <BottomBarCTA>
          <div className="grid gap-3 sm:grid-cols-5 sm:items-end">
            <div className="sm:col-span-3">
              <label className="block text-lg font-semibold" htmlFor="draft">
                Your reply
              </label>
              <textarea
                id="draft"
                className="mt-2 w-full resize-y rounded-2xl bg-zinc-50 p-4 text-lg ring-1 ring-zinc-200 focus:outline-none focus:ring-4 focus:ring-[var(--accent-ring)] dark:bg-zinc-950 dark:ring-zinc-800"
                rows={2}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type, or use the microphone buttons…"
              />
            </div>
            <div className="sm:col-span-2 grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <PrimaryButton
                  type="button"
                  size="lg"
                  variant="primary"
                  onClick={startRecording}
                  disabled={!canRecord}
                >
                  {recStatus === "recording" ? "Recording…" : "Record"}
                </PrimaryButton>
                <PrimaryButton
                  type="button"
                  size="lg"
                  variant="danger"
                  onClick={stopAndTranscribe}
                  disabled={!canStop}
                >
                  Stop + STT
                </PrimaryButton>
              </div>
              <PrimaryButton type="button" size="xl" onClick={send}>
                Send
              </PrimaryButton>
            </div>
          </div>
        </BottomBarCTA>
      </div>
    </AppShell>
  );
}

