import type { Match } from "@/lib/sampleData";
import type { UserProfile } from "@/lib/localProfile";
import { DEFAULT_MAP_CENTER, haversineKm } from "@/lib/geo";

function passesFilters(m: Match, profile: UserProfile | null): boolean {
  if (!profile) return true;
  const [minA, maxA] = profile.ageRange ?? [50, 90];
  if (m.age < minA || m.age > maxA) return false;
  const prefs = profile.genderPrefs ?? [];
  if (prefs.length > 0 && !prefs.includes(m.gender)) return false;
  const rKm = profile.matchRadius ?? 100;
  const lat = profile.latitude ?? DEFAULT_MAP_CENTER.lat;
  const lng = profile.longitude ?? DEFAULT_MAP_CENTER.lng;
  const d = haversineKm(lat, lng, m.lat, m.lng);
  if (d > rKm) return false;
  return true;
}

export type RankedMatch = Match & { distanceKm: number };

/** Closest-first within filters (compatibility ≈ proximity for this demo). */
export function rankMatches(
  matches: Match[],
  profile: UserProfile | null,
): RankedMatch[] {
  const lat = profile?.latitude ?? DEFAULT_MAP_CENTER.lat;
  const lng = profile?.longitude ?? DEFAULT_MAP_CENTER.lng;
  return matches
    .filter((m) => passesFilters(m, profile))
    .map((m) => ({
      ...m,
      distanceKm: Math.round(haversineKm(lat, lng, m.lat, m.lng)),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
