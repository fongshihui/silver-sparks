"use client";

import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { loadVoicePrefs, saveVoicePrefs } from "@/lib/voicePrefs";
import { useTtsPlayer } from "@/hooks/useTtsPlayer";
import { useMemo, useState } from "react";

export function VoiceModeToggle({
  label,
  speakText,
}: {
  label: string;
  speakText: string;
}) {
  const initial = useMemo(() => loadVoicePrefs(), []);
  const [prefs, setPrefs] = useState(initial);
  const { play, isPlaying } = useTtsPlayer();

  async function toggle() {
    const next = { ...prefs, enabled: !prefs.enabled };
    setPrefs(next);
    saveVoicePrefs(next);
    if (!next.unlocked) {
      // First user gesture: "unlock" speech by playing a short message.
      try {
        await play("Voice mode is ready.");
        const unlocked = { ...next, unlocked: true };
        setPrefs(unlocked);
        saveVoicePrefs(unlocked);
      } catch {
        // ignore
      }
    }
  }

  async function speakNow() {
    try {
      await play(speakText);
      const unlocked = { ...prefs, unlocked: true };
      setPrefs(unlocked);
      saveVoicePrefs(unlocked);
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <PrimaryButton
        type="button"
        variant={prefs.enabled ? "primary" : "secondary"}
        onClick={toggle}
      >
        {prefs.enabled ? "Voice mode: ON" : "Voice mode: OFF"}
      </PrimaryButton>
      <PrimaryButton
        type="button"
        variant="secondary"
        onClick={speakNow}
        disabled={isPlaying}
        aria-label={label}
        title={label}
      >
        Read aloud
      </PrimaryButton>
    </div>
  );
}

