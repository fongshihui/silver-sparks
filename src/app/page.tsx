"use client";

import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useTtsPlayer } from "@/hooks/useTtsPlayer";
import { isAuthenticated } from "@/lib/auth";
import { isOnboarded, loadProfile, mergeProfile } from "@/lib/localProfile";
import { rankMatches, type RankedMatch } from "@/lib/matchRanking";
import { sampleMatches } from "@/lib/sampleData";
import { SwipeableMatchCard } from "@/components/ui/SwipeableMatchCard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [profile] = useState(() => loadProfile());
  const [authed] = useState(() => isAuthenticated());
  const onboarded = isOnboarded(profile);
  const lang = profile?.language ?? "en";
  const { play } = useTtsPlayer(lang);

  useEffect(() => {
    if (authed && !onboarded) {
      router.replace(profile?.language ? "/onboarding/voice/1" : "/onboarding/language");
    }
  }, [authed, onboarded, profile?.language, router]);

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
          : "Friendship and romance for your golden years"
      }
    >
      <div className="grid gap-4">
        {!onboarded ? (
          <Card className="flex flex-col items-center justify-center gap-8 py-14 text-center">
            <div className="flex max-w-lg flex-col gap-3">
              <h2
                className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]"
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
              >
                Welcome to Silver Sparks
              </h2>
              <p className="text-base text-[var(--foreground-muted)] leading-relaxed">
                Friendship and romance for your golden years. Choose your language and we'll walk you through a
                short setup.
              </p>
            </div>
            <div className="flex w-full max-w-sm flex-col gap-3">
              <Link href="/signup" className="w-full">
                <PrimaryButton size="xl" className="w-full">
                  Sign up with email
                </PrimaryButton>
              </Link>
              <Link
                href="/login"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-3 text-center text-base font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-hover)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                Log in
              </Link>
            </div>
          </Card>
        ) : (
          <>
            <Card>
              <div
                className="text-base font-bold text-[var(--foreground)]"
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
              >
                Safety reminder
              </div>
              <p className="mt-2 text-sm text-[var(--foreground-muted)] leading-relaxed">{reminder}</p>
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
                <h2
                  className="mb-2 text-2xl font-bold text-[var(--foreground)]"
                  style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                >
                  No more people in your radius
                </h2>
                <p className="text-base text-[var(--foreground-muted)]">
                  Try widening age or distance in{" "}
                  <Link href="/profile" className="font-semibold text-[var(--accent)] underline underline-offset-4">
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
