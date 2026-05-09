"use client";

import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { isOnboarded, loadProfile } from "@/lib/localProfile";
import { sampleMatches } from "@/lib/sampleData";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function ChatsPage() {
  const [profile] = useState(() => loadProfile());
  const onboarded = isOnboarded(profile);

  const threads = useMemo(() => {
    const ids = new Set(profile?.likedMatchIds ?? []);
    return sampleMatches.filter((m) => ids.has(m.id));
  }, [profile?.likedMatchIds]);

  return (
    <AppShell
      title="Chats"
      subtitle={
        onboarded
          ? "People you swiped right on. Our safety tools watch for scams; a human can step in if needed."
          : "Finish sign-up to see your chats."
      }
    >
      <div className="grid gap-4">
        {!onboarded ? (
          <Card className="text-center text-lg text-zinc-700 dark:text-zinc-200">
            <Link href="/onboarding/language" className="font-semibold underline underline-offset-4">
              Complete setup
            </Link>{" "}
            to use messages.
          </Card>
        ) : threads.length === 0 ? (
          <Card className="text-center">
            <p className="text-lg text-zinc-700 dark:text-zinc-200">
              No conversations yet. On{" "}
              <Link href="/" className="font-semibold underline underline-offset-4">
                Matches
              </Link>
              , swipe right on someone you’d like to talk to.
            </p>
          </Card>
        ) : (
          <ul className="grid gap-4">
            {threads.map((m) => (
              <li key={m.id}>
                <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-xl font-extrabold">
                      {m.name}{" "}
                      <span className="text-lg font-semibold text-zinc-500">· {m.age}</span>
                    </div>
                    <div className="mt-1 text-base text-zinc-600 dark:text-zinc-300">
                      {m.city}
                    </div>
                  </div>
                  <Link href={`/chat/${m.id}`}>
                    <PrimaryButton className="w-full sm:w-auto">Open chat</PrimaryButton>
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
