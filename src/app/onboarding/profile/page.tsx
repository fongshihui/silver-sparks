"use client";

import { AppShell } from "@/components/AppShell";
import { BottomBarCTA } from "@/components/ui/BottomBarCTA";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { loadProfile, mergeProfile } from "@/lib/localProfile";
import Link from "next/link";
import { useMemo, useState } from "react";

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
  const [name, setName] = useState(() => initial.name ?? "");
  const [age, setAge] = useState<string>(() =>
    typeof initial.age === "number" ? String(initial.age) : "",
  );
  const [city, setCity] = useState(() => initial.city ?? "");
  const [bio, setBio] = useState(() => initial.bio ?? "");
  const [selected, setSelected] = useState<string[]>(() =>
    Array.isArray(initial.interests) ? initial.interests : [],
  );

  const ageNumber = useMemo(() => {
    const n = Number(age);
    if (!Number.isFinite(n)) return null;
    if (n < 18 || n > 120) return null;
    return n;
  }, [age]);

  const canContinue = useMemo(() => {
    return name.trim().length > 0 && ageNumber !== null && city.trim().length > 0;
  }, [name, ageNumber, city]);

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
    });
  }

  return (
    <AppShell
      title="Set up your profile"
      subtitle="Step 2 of 3 — A few basics."
    >
      <div className="grid gap-4">
        <Card>
          <ProgressDots total={3} activeIndex={1} />
          <div className="mt-4 text-2xl font-extrabold tracking-tight">
            Your profile details
          </div>
          <p className="mt-2 text-lg text-zinc-700 dark:text-zinc-200">
            Keep it simple. You can change this later.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-lg font-semibold" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                className="mt-2 w-full rounded-2xl bg-zinc-50 px-4 py-4 text-lg ring-1 ring-zinc-200 focus:outline-none focus:ring-4 focus:ring-[var(--accent-ring)] dark:bg-zinc-950 dark:ring-zinc-800"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={saveDraft}
                placeholder="e.g. Renee"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold" htmlFor="age">
                Age
              </label>
              <input
                id="age"
                inputMode="numeric"
                className="mt-2 w-full rounded-2xl bg-zinc-50 px-4 py-4 text-lg ring-1 ring-zinc-200 focus:outline-none focus:ring-4 focus:ring-[var(--accent-ring)] dark:bg-zinc-950 dark:ring-zinc-800"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                onBlur={saveDraft}
                placeholder="e.g. 62"
              />
              {age.length > 0 && ageNumber === null ? (
                <div className="mt-2 text-base font-semibold text-rose-700 dark:text-rose-300">
                  Please enter an age between 18 and 120.
                </div>
              ) : null}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-lg font-semibold" htmlFor="city">
                City
              </label>
              <input
                id="city"
                className="mt-2 w-full rounded-2xl bg-zinc-50 px-4 py-4 text-lg ring-1 ring-zinc-200 focus:outline-none focus:ring-4 focus:ring-[var(--accent-ring)] dark:bg-zinc-950 dark:ring-zinc-800"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onBlur={saveDraft}
                placeholder="e.g. Singapore"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-lg font-semibold" htmlFor="bio">
                About you (optional)
              </label>
              <textarea
                id="bio"
                className="mt-2 w-full resize-y rounded-2xl bg-zinc-50 p-4 text-lg ring-1 ring-zinc-200 focus:outline-none focus:ring-4 focus:ring-[var(--accent-ring)] dark:bg-zinc-950 dark:ring-zinc-800"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                onBlur={saveDraft}
                placeholder="e.g. I love morning walks and good conversation."
              />
            </div>
          </div>

          <div className="mt-6">
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
                        : "bg-zinc-100 text-zinc-800 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700",
                    ].join(" ")}
                  >
                    <Pill>{tag}</Pill>
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
              className="text-lg font-semibold text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-300"
            >
              Back
            </Link>
            <Link
              aria-disabled={!canContinue}
              tabIndex={canContinue ? 0 : -1}
              href={canContinue ? "/onboarding/voice" : "#"}
              className={canContinue ? "" : "pointer-events-none opacity-60"}
              onClick={() => saveDraft()}
            >
              <PrimaryButton size="xl" disabled={!canContinue}>
                Continue
              </PrimaryButton>
            </Link>
          </div>
        </BottomBarCTA>
      </div>
    </AppShell>
  );
}

