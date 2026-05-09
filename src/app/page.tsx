"use client";

import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useTtsPlayer } from "@/hooks/useTtsPlayer";
import { isOnboarded, loadProfile, mergeProfile } from "@/lib/localProfile";
import { rankMatches, type RankedMatch } from "@/lib/matchRanking";
import { sampleMatches } from "@/lib/sampleData";
import { SwipeableMatchCard } from "@/components/ui/SwipeableMatchCard";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function Home() {
  const [profile] = useState(() => loadProfile());
  const onboarded = isOnboarded(profile);
  const lang = profile?.language ?? "en";
  const { play } = useTtsPlayer(lang);

  const [deck, setDeck] = useState<RankedMatch[]>(() =>
    rankMatches(sampleMatches, loadProfile()),
  );

  const reminder = useMemo(
    () =>
      "If anyone asks for money, gift cards, or tries to rush you, pause. Keep all chats here and ask someone you trust.",
    [],
  );

  const handleSwipeLeft = (id: string) => {
    setTimeout(() => setDeck((m) => m.filter((x) => x.id !== id)), 200);
  };

  const handleSwipeRight = (m: RankedMatch) => {
    const p = loadProfile() ?? {};
    const prev = p.likedMatchIds ?? [];
    mergeProfile({ likedMatchIds: [...new Set([...prev, m.id])] });
    setTimeout(() => setDeck((prevDeck) => prevDeck.filter((x) => x.id !== m.id)), 200);
  };

  return (
    <AppShell
      title={onboarded ? "Matches" : "Silver Sparks"}
      subtitle={
        onboarded
          ? "Swipe right on people you’d like to talk to. Closest matches first."
          : "Friendship and romance for your golden years — large text, gentle steps, and safety built in."
      }
    >
      <div className="grid gap-4">
        {!onboarded ? (
          <Card className="flex flex-col items-center justify-center gap-8 py-14 text-center">
            <div className="flex max-w-lg flex-col gap-3">
              <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                Welcome
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-300">
                First, choose the language you want for voice prompts and read-aloud.
                We’ll walk you through a few short questions, a photo for a cute avatar,
                and your profile before you see anyone.
              </p>
            </div>
            <div className="flex w-full max-w-sm flex-col gap-4">
              <Link href="/onboarding/language" className="w-full">
                <PrimaryButton size="xl" className="w-full">
                  Choose language & sign up
                </PrimaryButton>
              </Link>
              <button
                type="button"
                onClick={() =>
                  alert("Log in is not wired in this demo — use Sign up on this device.")
                }
                className="w-full rounded-2xl bg-zinc-100 py-4 text-lg font-semibold text-zinc-800 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                Log in (demo)
              </button>
            </div>
          </Card>
        ) : (
          <>
            <Card>
              <div className="text-lg font-semibold">Safety reminder</div>
              <p className="mt-2 text-lg text-zinc-700 dark:text-zinc-200">{reminder}</p>
              <PrimaryButton
                type="button"
                variant="secondary"
                className="mt-4"
                onClick={() => play(reminder)}
              >
                Read aloud
              </PrimaryButton>
            </Card>

            {deck.length > 0 ? (
              <div className="relative mt-4 flex h-[520px] w-full justify-center">
                {deck.map((m, index) => (
                  <SwipeableMatchCard
                    key={m.id}
                    m={m}
                    zIndex={deck.length - index}
                    onSwipeLeft={() => handleSwipeLeft(m.id)}
                    onSwipeRight={() => handleSwipeRight(m)}
                    playText={play}
                  />
                ))}
              </div>
            ) : (
              <Card className="py-10 text-center">
                <h2 className="mb-2 text-2xl font-bold">No more people in your radius</h2>
                <p className="text-lg text-zinc-600 dark:text-zinc-300">
                  Try widening age or distance in{" "}
                  <Link href="/profile" className="font-semibold underline underline-offset-4">
                    My profile
                  </Link>
                  , or check back later.
                </p>
              </Card>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
