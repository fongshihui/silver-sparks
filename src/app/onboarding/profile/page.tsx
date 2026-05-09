"use client";

import { AppShell } from "@/components/AppShell";
import { BottomBarCTA } from "@/components/ui/BottomBarCTA";
import { Card } from "@/components/ui/Card";
import { LocationMapSection } from "@/components/LocationMapSection";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { DEFAULT_MAP_CENTER, geocodeCityToLatLng } from "@/lib/geo";
import { loadProfile, mergeProfile } from "@/lib/localProfile";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

const defaultInterests = [
  "Coffee",
  "Walks",
  "Food",
  "Movies",
  "Music",
  "Gardening",
  "Travel",
  "Family",
];

export default function ProfileStepPage() {
  const initial = useMemo(() => loadProfile() ?? {}, []);
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const [name, setName] = useState(
    () => initial.name ?? initial.voiceAnswers?.nickname ?? "",
  );
  const [age, setAge] = useState<string>(() =>
    typeof initial.age === "number" ? String(initial.age) : "",
  );
  const [city, setCity] = useState(() => initial.city ?? "");
  const [bio, setBio] = useState(() => initial.bio ?? "");
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [matchRadius, setMatchRadius] = useState(() => initial.matchRadius ?? 25);
  const [ageRange, setAgeRange] = useState<[number, number]>(
    () => initial.ageRange ?? [55, 85],
  );
  const [genderPrefs, setGenderPrefs] = useState<string[]>(
    () => initial.genderPrefs ?? ["Women", "Men"],
  );
  const [selected, setSelected] = useState<string[]>(() =>
    Array.isArray(initial.interests) ? initial.interests : [],
  );
  const [latitude, setLatitude] = useState(
    () => initial.latitude ?? DEFAULT_MAP_CENTER.lat,
  );
  const [longitude, setLongitude] = useState(
    () => initial.longitude ?? DEFAULT_MAP_CENTER.lng,
  );
  const [isGeocodingCity, setIsGeocodingCity] = useState(false);
  const [cityGeoHint, setCityGeoHint] = useState<string | null>(null);

  const onMapLocation = useCallback((lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    mergeProfile({ latitude: lat, longitude: lng });
  }, []);

  async function syncMapToCity() {
    const normalizedCity = city.trim();
    if (!normalizedCity) return;
    if (!mapsKey) {
      saveDraft();
      return;
    }

    setIsGeocodingCity(true);
    setCityGeoHint(null);
    try {
      const point = await geocodeCityToLatLng(normalizedCity, mapsKey);
      if (!point) {
        setCityGeoHint("Could not locate this city. You can drag the map pin manually.");
        saveDraft();
        return;
      }
      setLatitude(point.lat);
      setLongitude(point.lng);
      mergeProfile({
        city: normalizedCity,
        latitude: point.lat,
        longitude: point.lng,
      });
      setCityGeoHint("Map updated from your city.");
    } catch {
      setCityGeoHint("Could not update map from city right now.");
      saveDraft();
    } finally {
      setIsGeocodingCity(false);
    }
  }

  const ageNumber = useMemo(() => {
    const n = Number(age);
    if (!Number.isFinite(n)) return null;
    if (n < 18 || n > 120) return null;
    return n;
  }, [age]);

  const canContinue = useMemo(() => {
    return name.trim().length > 0 && ageNumber !== null && city.trim().length > 0;
  }, [name, ageNumber, city]);

  const canSuggestBio = useMemo(() => {
    const va = initial.voiceAnswers;
    return Boolean(va && Object.keys(va).length > 0);
  }, [initial.voiceAnswers]);

  function toggleInterest(tag: string) {
    setSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function saveDraft() {
    mergeProfile({
      name: name.trim(),
      age: ageNumber ?? undefined,
      city: city.trim(),
      bio: bio.trim(),
      interests: selected,
      matchRadius,
      ageRange,
      genderPrefs,
      latitude,
      longitude,
    });
  }

  async function generateBioFromVoice() {
    if (!initial.voiceAnswers) return;
    setIsGeneratingBio(true);
    try {
      const res = await fetch("/api/openai/bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceAnswers: initial.voiceAnswers }),
      });
      const data = (await res.json()) as { bio?: string };
      if (data.bio) {
        setBio(data.bio);
        mergeProfile({ bio: data.bio });
      }
    } catch {
      /* keep UI calm for seniors */
    } finally {
      setIsGeneratingBio(false);
    }
  }

  function toggleGender(g: string) {
    setGenderPrefs((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g],
    );
  }

  return (
    <AppShell
      title="Your dating profile"
      subtitle="Step 4 of 4 — Review, adjust, then start meeting people."
    >
      <div className="grid gap-4">
        <Card>
          <ProgressDots total={4} activeIndex={3} />
          <div
            className="mt-4 text-2xl font-extrabold tracking-tight text-[var(--foreground)]"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            Check your details
          </div>
          <p className="mt-2 text-base text-[var(--foreground-muted)] leading-relaxed">
            We started this from your voice answers and avatar. Change anything you
            like before you continue.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              {!bio && canSuggestBio ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <PrimaryButton
                    type="button"
                    variant="secondary"
                    disabled={isGeneratingBio}
                    onClick={() => void generateBioFromVoice()}
                  >
                    {isGeneratingBio
                      ? "Writing your about-me…"
                      : "Write my about-me from my voice answers"}
                  </PrimaryButton>
                </div>
              ) : null}
            </div>
            <div>
              <label className="block text-base font-semibold text-[var(--foreground)]" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:border-[var(--accent)] transition-colors"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={saveDraft}
                placeholder="What friends should call you"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-[var(--foreground)]" htmlFor="age">
                Age
              </label>
              <input
                id="age"
                inputMode="numeric"
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:border-[var(--accent)] transition-colors"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                onBlur={saveDraft}
                placeholder="e.g. 72"
              />
              {age.length > 0 && ageNumber === null ? (
                <div className="mt-2 text-base font-semibold text-rose-700 dark:text-rose-300">
                  Please enter an age between 18 and 120.
                </div>
              ) : null}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-base font-semibold text-[var(--foreground)]" htmlFor="city">
                City or area
              </label>
              <input
                id="city"
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:border-[var(--accent)] transition-colors"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onBlur={() => void syncMapToCity()}
                placeholder="e.g. Singapore"
              />
              {isGeocodingCity ? (
                <div className="mt-2 text-sm font-semibold text-[var(--foreground-muted)]">
                  Updating map from city...
                </div>
              ) : null}
              {cityGeoHint ? (
                <div className="mt-2 text-sm font-semibold text-[var(--foreground-muted)]">
                  {cityGeoHint}
                </div>
              ) : null}
            </div>

            <div className="sm:col-span-2">
              <div className="text-lg font-semibold">Location on map</div>
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                Helps sort people by distance. Drag the pin if the default spot is
                wrong.
              </p>
              <div className="mt-3">
                <LocationMapSection
                  apiKey={mapsKey}
                  lat={latitude}
                  lng={longitude}
                  onLocationChange={onMapLocation}
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-base font-semibold text-[var(--foreground)]" htmlFor="bio">
                About you
              </label>
              <textarea
                id="bio"
                className="mt-2 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-base text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:border-[var(--accent)] transition-colors disabled:opacity-50"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                onBlur={saveDraft}
                disabled={isGeneratingBio}
                placeholder="A few sentences about you."
              />
            </div>
          </div>

          <div className="mt-8 border-t border-[var(--border)] pt-6">
            <div
              className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              Who you'd like to meet
            </div>

            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-lg font-semibold" htmlFor="matchRadius">
                  Search radius: {matchRadius} km
                </label>
                <input
                  id="matchRadius"
                  type="range"
                  min={1}
                  max={100}
                  value={matchRadius}
                  onChange={(e) => setMatchRadius(Number(e.target.value))}
                  onBlur={saveDraft}
                  className="mt-2 w-full"
                />
              </div>

              <div>
                <div className="text-lg font-semibold">Their age range</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    min={18}
                    max={120}
                    className="w-24 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-center text-base text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:border-[var(--accent)] transition-colors"
                    value={ageRange[0]}
                    onChange={(e) =>
                      setAgeRange([Number(e.target.value), ageRange[1]])
                    }
                    onBlur={saveDraft}
                  />
                  <span className="text-lg">to</span>
                  <input
                    type="number"
                    min={18}
                    max={120}
                    className="w-24 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-center text-base text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:border-[var(--accent)] transition-colors"
                    value={ageRange[1]}
                    onChange={(e) =>
                      setAgeRange([ageRange[0], Number(e.target.value)])
                    }
                    onBlur={saveDraft}
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <div className="text-lg font-semibold mb-2">Open to meeting</div>
                <div className="flex flex-wrap gap-2">
                  {["Men", "Women", "Other"].map((g) => {
                    const on = genderPrefs.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => toggleGender(g)}
                        className={[
                          "rounded-full px-4 py-2 text-base font-semibold ring-1",
                          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-ring)]",
                          on
                            ? "bg-[var(--accent)] text-white ring-transparent"
                            : "bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]",
                        ].join(" ")}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-[var(--border)] pt-6">
            <div className="text-lg font-semibold">Interests (optional)</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {defaultInterests.map((tag) => {
                const on = selected.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      toggleInterest(tag);
                      setTimeout(saveDraft, 0);
                    }}
                    className={[
                      "rounded-full px-3 py-2 text-base font-semibold ring-1",
                      "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-ring)]",
                      on
                        ? "bg-[var(--accent)] text-white ring-transparent"
                        : "bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]",
                    ].join(" ")}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <BottomBarCTA>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/onboarding/selfie"
              className="text-base font-semibold text-[var(--foreground-muted)] underline-offset-4 hover:underline hover:text-[var(--accent)]"
            >
              Back
            </Link>
            <Link
              aria-disabled={!canContinue}
              tabIndex={canContinue ? 0 : -1}
              href={canContinue ? "/onboarding/done" : "#"}
              className={canContinue ? "" : "pointer-events-none opacity-60"}
              onClick={() => {
                saveDraft();
                mergeProfile({ completedAtIso: new Date().toISOString() });
              }}
            >
              <PrimaryButton size="xl" disabled={!canContinue}>
                Confirm and finish
              </PrimaryButton>
            </Link>
          </div>
        </BottomBarCTA>
      </div>
    </AppShell>
  );
}
