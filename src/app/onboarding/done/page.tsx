"use client";

import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { loadProfile } from "@/lib/localProfile";
import Link from "next/link";
import { useState } from "react";

export default function DonePage() {
  const [name] = useState<string | null>(() => {
    const p = loadProfile();
    return p?.name ?? null;
  });

  return (
    <AppShell title="You’re all set" subtitle="Your profile is ready.">
      <Card className="text-center">
        <div className="text-3xl font-extrabold tracking-tight">
          Welcome{name ? `, ${name}` : ""}.
        </div>
        <p className="mt-3 text-lg text-zinc-700 dark:text-zinc-200">
          You can now browse matches and start chatting.
        </p>

        <div className="mt-6 flex justify-center">
          <Link href="/">
            <PrimaryButton size="xl">Go to matches</PrimaryButton>
          </Link>
        </div>
      </Card>
    </AppShell>
  );
}

