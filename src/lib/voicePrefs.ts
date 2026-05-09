export type VoicePrefs = {
  enabled: boolean;
  unlocked: boolean;
};

const KEY = "silverSparks.voicePrefs.v1";

export function loadVoicePrefs(): VoicePrefs {
  if (typeof window === "undefined") return { enabled: false, unlocked: false };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { enabled: false, unlocked: false };
    const parsed = JSON.parse(raw) as Partial<VoicePrefs>;
    return {
      enabled: Boolean(parsed.enabled),
      unlocked: Boolean(parsed.unlocked),
    };
  } catch {
    return { enabled: false, unlocked: false };
  }
}

export function saveVoicePrefs(next: VoicePrefs) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(next));
}

