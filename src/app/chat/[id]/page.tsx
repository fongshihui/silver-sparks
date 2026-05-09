"use client";

import { AppShell } from "@/components/AppShell";
import { BottomBarCTA } from "@/components/ui/BottomBarCTA";
import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useTtsPlayer } from "@/hooks/useTtsPlayer";
import { loadProfile } from "@/lib/localProfile";
import { sampleChats, sampleMatches, type ChatMessage } from "@/lib/sampleData";
import {
  localHeuristicSafetyCheck,
  type SafetyResult,
} from "@/lib/safety";
import { useParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

/**
 * Approvals are tracked per message id (not per chat) so that a moderator
 * approval doesn't permanently disable scam detection — if a *new* risky
 * message arrives later, the chat re-locks until that message is approved
 * too.
 */
const MODERATOR_APPROVED_MESSAGES_KEY = "silverSparks.moderatorApprovedMessages.v1";

function loadApprovedMessageIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(MODERATOR_APPROVED_MESSAGES_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function persistApprovedMessageIds(ids: Iterable<string>) {
  window.localStorage.setItem(
    MODERATOR_APPROVED_MESSAGES_KEY,
    JSON.stringify([...ids]),
  );
}

const SAFETY_BADGE_STYLES: Record<"high" | "medium", string> = {
  high:
    "border border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-200",
  medium:
    "border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
};

function MessageSafetyBadge({
  result,
  approved,
}: {
  result: SafetyResult;
  approved: boolean;
}) {
  if (result.level === "low") return null;
  const tone: "high" | "medium" = result.level === "high" ? "high" : "medium";
  const headline =
    result.level === "high"
      ? approved
        ? "Flagged · moderator approved"
        : "Possible scam — paused for review"
      : "Be careful with this message";

  const uniqueCategories = Array.from(
    new Set(result.reasons.map((r) => r.category)),
  );

  return (
    <div
      className={[
        "rounded-2xl px-3 py-2 text-sm font-semibold",
        SAFETY_BADGE_STYLES[tone],
      ].join(" ")}
      role="status"
    >
      <div className="flex items-center gap-2">
        <span aria-hidden="true">⚠️</span>
        <span>{headline}</span>
      </div>
      {uniqueCategories.length > 0 ? (
        <ul className="mt-1 list-disc pl-5 text-xs font-medium leading-relaxed">
          {uniqueCategories.map((cat) => {
            const reason = result.reasons.find((r) => r.category === cat);
            if (!reason) return null;
            return (
              <li key={cat}>
                {reason.label}{" "}
                <span className="font-mono">“{reason.match}”</span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function ChatRoom({ chatId }: { chatId: string }) {
  const id = chatId;

  const profile = useMemo(() => loadProfile(), []);
  const lang = profile?.language ?? "en";
  const { play } = useTtsPlayer(lang);

  const match = useMemo(() => sampleMatches.find((m) => m.id === id) ?? null, [id]);
  const initial = useMemo(() => sampleChats[id] ?? [], [id]);
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const [draft, setDraft] = useState("");
  const [approvedIds, setApprovedIds] = useState<Set<string>>(() =>
    loadApprovedMessageIds(),
  );

  const messageSafety = useMemo(() => {
    const map = new Map<string, SafetyResult>();
    for (const msg of messages) {
      map.set(msg.id, localHeuristicSafetyCheck(msg.text));
    }
    return map;
  }, [messages]);

  const unapprovedHighRiskMessages = useMemo(
    () =>
      messages.filter((m) => {
        const r = messageSafety.get(m.id);
        return r?.level === "high" && !approvedIds.has(m.id);
      }),
    [messages, messageSafety, approvedIds],
  );

  const blockingMessage = unapprovedHighRiskMessages[0] ?? null;
  const blockingResult = blockingMessage
    ? messageSafety.get(blockingMessage.id) ?? null
    : null;
  const isLocked = blockingMessage !== null;

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
    const idsToApprove = unapprovedHighRiskMessages.map((m) => m.id);
    if (idsToApprove.length === 0) return;
    setApprovedIds((prev) => {
      const next = new Set(prev);
      for (const messageId of idsToApprove) next.add(messageId);
      persistApprovedMessageIds(next);
      return next;
    });
  }

  return (
    <AppShell
      title={match ? `Chat with ${match.name}` : "Chat"}
      subtitle="Read aloud is available on each message. Voice typing uses your microphone."
    >
      <div className="grid gap-4">
        <Card>
          <div className="flex flex-col gap-3">
            {messages.map((m, idx) => {
              const mine = m.role === "me";
              const safety = messageSafety.get(m.id);
              const flagged = Boolean(safety && safety.level !== "low");
              const approved = approvedIds.has(m.id);
              const prev = idx > 0 ? messages[idx - 1] : null;
              const showSenderLabel = !mine && (!prev || prev.role !== m.role);

              const bubbleClass = (() => {
                if (flagged && safety) {
                  return safety.level === "high"
                    ? "bg-rose-50 text-rose-900 border-2 border-rose-300 dark:bg-rose-950/40 dark:text-rose-100 dark:border-rose-700"
                    : "bg-amber-50 text-amber-900 border-2 border-amber-300 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-700";
                }
                return mine
                  ? "bg-[var(--accent)] text-white border border-transparent"
                  : "bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)]";
              })();

              return (
                <div
                  key={m.id}
                  className={[
                    "flex w-full",
                    mine ? "justify-end" : "justify-start",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex w-fit max-w-[85%] flex-col sm:max-w-[75%]",
                      mine ? "items-end" : "items-start",
                    ].join(" ")}
                  >
                    {showSenderLabel ? (
                      <div className="mb-1 px-3 text-sm font-semibold text-[var(--foreground-muted)]">
                        {match?.name ?? "Them"}
                      </div>
                    ) : null}

                    <div
                      className={[
                        "px-4 py-3 text-lg font-semibold leading-snug shadow-sm sm:text-xl",
                        "rounded-3xl",
                        mine ? "rounded-br-md" : "rounded-bl-md",
                        bubbleClass,
                      ].join(" ")}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                    </div>

                    <div
                      className={[
                        "mt-1 flex items-center gap-3 px-1 text-xs text-[var(--foreground-muted)]",
                        mine ? "flex-row-reverse" : "flex-row",
                      ].join(" ")}
                    >
                      <span>{formatTime(m.createdAtIso)}</span>
                      <button
                        type="button"
                        onClick={() => play(m.text)}
                        className="rounded font-semibold text-[var(--accent)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                      >
                        Read aloud
                      </button>
                    </div>

                    {safety && safety.level !== "low" ? (
                      <div className="mt-2 w-full">
                        <MessageSafetyBadge result={safety} approved={approved} />
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {isLocked && blockingResult ? (
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
              Flag: {blockingResult.message}
            </p>
            {unapprovedHighRiskMessages.length > 1 ? (
              <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">
                {unapprovedHighRiskMessages.length} messages need review.
              </p>
            ) : null}
            <p className="mt-4 text-sm text-rose-700 dark:text-rose-300">
              In production, you would wait for our team. This demo can simulate an
              approval after review.
            </p>
            <PrimaryButton type="button" className="mt-5" onClick={simulateModeratorApproval}>
              Simulate: moderator approved {unapprovedHighRiskMessages.length > 1 ? "messages" : "this message"}
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
              <label className="block text-base font-semibold text-[var(--foreground)]" htmlFor="draft">
                Your reply
              </label>
              <textarea
                id="draft"
                className="mt-2 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-base text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:border-[var(--accent)] transition-colors disabled:cursor-not-allowed"
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
          <p className="text-base text-[var(--foreground-muted)]">No chat selected.</p>
        </Card>
      </AppShell>
    );
  }
  return <ChatRoom key={id} chatId={id} />;
}
