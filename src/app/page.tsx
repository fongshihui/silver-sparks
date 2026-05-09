"use client";

import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useTtsPlayer } from "@/hooks/useTtsPlayer";
import { isOnboarded, loadProfile } from "@/lib/localProfile";
import { sampleMatches } from "@/lib/sampleData";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [onboarded] = useState(() => isOnboarded(loadProfile()));
  const { play } = useTtsPlayer();

  return (
    <AppShell
      title="Matches"
      subtitle="Bigger text, fewer decisions, and safer conversations."
    >
      <div className="grid gap-4">
        {!onboarded ? (
          <Card className="bg-gradient-to-br from-white to-rose-50/60 dark:from-zinc-900 dark:to-rose-950/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="text-lg font-semibold">
                  Complete your profile
                </div>
                <p className="mt-1 text-lg text-zinc-700 dark:text-zinc-200">
                  Add a photo, basics, and a couple voice answers so matches
                  feel more real.
                </p>
              </div>
              <Link href="/onboarding">
                <PrimaryButton size="xl">Start setup</PrimaryButton>
              </Link>
            </div>
          </Card>
        ) : null}

        <Card>
          <div className="text-lg font-semibold">Today’s gentle reminder</div>
          <p className="mt-2 text-lg text-zinc-700 dark:text-zinc-200">
            If anyone asks for money, gift cards, crypto, or tries to rush you,
            pause. You can keep chatting here and ask a friend for advice.
          </p>
        </Card>

        <ul className="grid gap-4 sm:grid-cols-2" aria-label="Match list">
          {sampleMatches.map((m) => (
            <li key={m.id}>
              <Card className="h-full">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-2xl font-extrabold tracking-tight">
                      {m.name} <span className="text-zinc-500">· {m.age}</span>
                    </div>
                    <div className="mt-1 text-lg text-zinc-600 dark:text-zinc-300">
                      {m.city} · ~{m.distanceKm} km away
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col gap-2">
                    <PrimaryButton
                      variant="secondary"
                      onClick={() => play(`${m.name}. ${m.about}`)}
                    >
                      Read aloud
                    </PrimaryButton>
                    <Link href={`/chat/${m.id}`}>
                      <PrimaryButton>Chat</PrimaryButton>
                    </Link>
                  </div>
                </div>
                <p className="mt-3 text-lg text-zinc-700 dark:text-zinc-200">
                  {m.about}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {m.interests.map((tag) => (
                    <Pill key={tag}>{tag}</Pill>
                  ))}
                </div>
              </Card>
            </li>
          ))}
        </ul>

        <Card>
          <div className="text-lg font-semibold">Sponsor hooks (optional)</div>
          <ul className="mt-2 list-disc pl-6 text-lg text-zinc-700 dark:text-zinc-200">
            <li>
              OpenAI: scam-risk explanation + suggested reply (when API key is
              set).
            </li>
            <li>ElevenLabs: voice read-aloud for messages (when key is set).</li>
            <li>Convex: store chats/profiles if you enable it later.</li>
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
