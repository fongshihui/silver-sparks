"use client";

import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { clearProfile, loadProfile } from "@/lib/localProfile";
import Link from "next/link";
import { useState } from "react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<ReturnType<typeof loadProfile>>(() =>
    loadProfile(),
  );

  const p = profile;

  return (
    <AppShell title="My profile" subtitle="Your details stay on this device.">
      <div className="grid gap-4">
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="w-full sm:w-56">
              {p?.avatarDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt="Your profile avatar"
                  src={p.avatarDataUrl}
                  className="aspect-square w-full rounded-3xl object-cover ring-1 ring-zinc-200 dark:ring-zinc-800"
                />
              ) : p?.selfieDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt="Your profile photo"
                  src={p.selfieDataUrl}
                  className="aspect-square w-full rounded-3xl object-cover ring-1 ring-zinc-200 dark:ring-zinc-800"
                />
              ) : (
                <div className="grid aspect-square w-full place-items-center rounded-3xl bg-zinc-50 text-lg font-semibold text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:text-zinc-400 dark:ring-zinc-800">
                  No photo
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-3xl font-extrabold tracking-tight">
                {p?.name ?? "Your name"}{" "}
                {typeof p?.age === "number" ? (
                  <span className="text-zinc-500">· {p.age}</span>
                ) : null}
              </div>
              <div className="mt-1 text-lg font-semibold text-zinc-600 dark:text-zinc-300">
                {p?.city ?? "Your city"}
              </div>

              {p?.bio ? (
                <p className="mt-4 text-lg text-zinc-700 dark:text-zinc-200">
                  {p.bio}
                </p>
              ) : null}

              {p?.interests?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.interests.map((tag) => (
                    <Pill key={tag}>{tag}</Pill>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </Card>

        <Card>
          <div className="text-lg font-semibold">Voice answers</div>
          {p?.voiceAnswers && Object.keys(p.voiceAnswers).length > 0 ? (
            <div className="mt-3 grid gap-3">
              {Object.entries(p.voiceAnswers).map(([id, text]) => (
                <div
                  key={id}
                  className="rounded-2xl bg-zinc-50 p-4 text-lg text-zinc-900 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:text-zinc-50 dark:ring-zinc-800"
                >
                  {text}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-lg text-zinc-700 dark:text-zinc-200">
              No voice answers yet.
            </p>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/onboarding">
              <PrimaryButton variant="secondary">Edit via setup</PrimaryButton>
            </Link>
            <PrimaryButton
              variant="danger"
              onClick={() => {
                clearProfile();
                setProfile(loadProfile());
              }}
            >
              Clear local profile
            </PrimaryButton>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

