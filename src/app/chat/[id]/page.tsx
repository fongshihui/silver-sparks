"use client";

import { AppShell } from "@/components/AppShell";
import { BottomBarCTA } from "@/components/ui/BottomBarCTA";
import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useTtsPlayer } from "@/hooks/useTtsPlayer";
import { loadProfile } from "@/lib/localProfile";
import { sampleChats, sampleMatches } from "@/lib/sampleData";
import { localHeuristicSafetyCheck } from "@/lib/safety";
import { useParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

const MODERATOR_CLEAR_KEY = "silverSparks.moderatorClear.v1";

function loadModeratorClearSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(MODERATOR_CLEAR_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function addModeratorClear(chatId: string) {
  const s = loadModeratorClearSet();
  s.add(chatId);
  window.localStorage.setItem(MODERATOR_CLEAR_KEY, JSON.stringify([...s]));
}

function ChatRoom({ chatId }: { chatId: string }) {
  const id = chatId;

  const profile = useMemo(() => loadProfile(), []);
  const lang = profile?.language ?? "en";
  const { play } = useTtsPlayer(lang);

  const match = useMemo(() => sampleMatches.find((m) => m.id === id) ?? null, [id]);
  const initial = useMemo(() => sampleChats[id] ?? [], [id]);
  const [messages, setMessages] = useState(initial);
  const [draft, setDraft] = useState("");
  const [moderatorCleared, setModeratorCleared] = useState(
    () => typeof window !== "undefined" && id !== "" && loadModeratorClearSet().has(id),
  );

  const scamCheck = useMemo(() => {
    for (const msg of messages) {
      const check = localHeuristicSafetyCheck(msg.text);
      if (check.level === "high") {
        return check;
      }
    }
    return null;
  }, [messages]);

  const isLocked = Boolean(scamCheck) && !moderatorCleared;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [recStatus, setRecStatus] = useState<"idle" | "recording" | "processing">(
    "idle",
  );
  const canRecord = recStatus === "idle";
  const canStop = recStatus === "recording";

  async function startRecording() {
    if (!canRecord || isLocked) return;
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
    if (!canStop || isLocked) return;
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
      if (lang !== "en") fd.append("language_code", lang);
      const res = await fetch("/api/elevenlabs/stt", { method: "POST", body: fd });
      if (!res.ok) throw new Error("STT failed");
      const json = (await res.json()) as { text?: string; transcript?: string };
      const text = (json.text ?? json.transcript ?? "").trim();
      if (text) setDraft(text);
    } catch {
      /* silent */
    } finally {
      setRecStatus("idle");
    }
  }

  function send() {
    const text = draft.trim();
    if (!text || isLocked) return;
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

  function simulateModeratorApproval() {
    addModeratorClear(id);
    setModeratorCleared(true);
  }

  return (
    <AppShell
      title={match ? `Chat with ${match.name}` : "Chat"}
      subtitle="Read aloud is available on each message. Voice typing uses your microphone."
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
                      <div className="mt-1 text-xl font-extrabold leading-snug">{m.text}</div>
                    </div>
                    <PrimaryButton type="button" variant="secondary" onClick={() => play(m.text)}>
                      Read aloud
                    </PrimaryButton>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {isLocked && scamCheck ? (
          <Card className="border-2 border-rose-400 bg-rose-50 p-6 text-center dark:border-rose-700 dark:bg-rose-950/35">
            <h2 className="mb-2 text-2xl font-extrabold text-rose-800 dark:text-rose-200">
              Chat paused for safety review
            </h2>
            <p className="text-lg text-rose-900 dark:text-rose-100">
              Our automated helper spotted something that often appears in scams. A human
              moderator can review and allow the conversation to continue, or block bad
              actors.
            </p>
            <p className="mt-3 text-base font-semibold text-rose-800/90 dark:text-rose-200/90">
              Flag: {scamCheck.message}
            </p>
            <p className="mt-4 text-sm text-rose-700 dark:text-rose-300">
              In production, you would wait for our team. This demo can simulate an
              approval after review.
            </p>
            <PrimaryButton type="button" className="mt-5" onClick={simulateModeratorApproval}>
              Simulate: moderator approved chat
            </PrimaryButton>
          </Card>
        ) : null}

        <BottomBarCTA>
          <div
            className={[
              "grid gap-3 sm:grid-cols-5 sm:items-end",
              isLocked ? "opacity-45 grayscale" : "",
            ].join(" ")}
          >
            <div className="sm:col-span-3">
              <label className="block text-lg font-semibold" htmlFor="draft">
                Your reply
              </label>
              <textarea
                id="draft"
                className="mt-2 w-full resize-y rounded-2xl bg-zinc-50 p-4 text-lg ring-1 ring-zinc-200 focus:outline-none focus:ring-4 focus:ring-[var(--accent-ring)] disabled:cursor-not-allowed dark:bg-zinc-950 dark:ring-zinc-800"
                rows={2}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={isLocked}
                placeholder={
                  isLocked
                    ? "Chat paused — moderator review"
                    : "Type, or use the microphone buttons…"
                }
              />
            </div>
            <div className="sm:col-span-2 grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <PrimaryButton
                  type="button"
                  size="lg"
                  onClick={startRecording}
                  disabled={!canRecord || isLocked}
                >
                  {recStatus === "recording" ? "Recording…" : "Record"}
                </PrimaryButton>
                <PrimaryButton
                  type="button"
                  size="lg"
                  variant="danger"
                  onClick={() => void stopAndTranscribe()}
                  disabled={!canStop || isLocked}
                >
                  Stop
                </PrimaryButton>
              </div>
              <PrimaryButton
                type="button"
                size="xl"
                onClick={send}
                disabled={isLocked || !draft.trim()}
              >
                Send
              </PrimaryButton>
            </div>
          </div>
        </BottomBarCTA>
      </div>
    </AppShell>
  );
}

export default function ChatPage() {
  const { id: rawId } = useParams<{ id: string | string[] }>();
  const id = Array.isArray(rawId) ? rawId[0] : rawId ?? "";
  if (!id) {
    return (
      <AppShell title="Chat" subtitle="Pick a conversation from Chats.">
        <Card>
          <p className="text-lg text-zinc-700 dark:text-zinc-200">No chat selected.</p>
        </Card>
      </AppShell>
    );
  }
  return <ChatRoom key={id} chatId={id} />;
}
