export type VoiceAnswers = Record<string, string>;

export type UserProfile = {
  selfieDataUrl?: string;
  avatarDataUrl?: string;
  name?: string;
  age?: number;
  city?: string;
  bio?: string;
  interests?: string[];
  voiceAnswers?: VoiceAnswers;
  completedAtIso?: string;
};

const STORAGE_KEY = "silverSparks.userProfile.v1";

export function loadProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: UserProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function clearProfile() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function isOnboarded(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return Boolean(profile.completedAtIso);
}

export function mergeProfile(patch: UserProfile) {
  const current = loadProfile() ?? {};
  const merged: UserProfile = {
    ...current,
    ...patch,
    interests: patch.interests ?? current.interests,
    voiceAnswers: { ...(current.voiceAnswers ?? {}), ...(patch.voiceAnswers ?? {}) },
  };
  saveProfile(merged);
  return merged;
}

