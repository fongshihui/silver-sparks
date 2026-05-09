"use client";

import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { getCurrentEmail, logOut } from "@/lib/auth";
import { clearProfile, loadProfile } from "@/lib/localProfile";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ReturnType<typeof loadProfile>>(() =>
    loadProfile(),
  );
  const [email] = useState<string | null>(() => getCurrentEmail());

  const p = profile;

  function handleLogOut() {
    logOut();
    router.replace("/");
    router.refresh();
  }

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
                  className="aspect-square w-full rounded-2xl object-cover border border-[var(--border)]"
                />
              ) : p?.selfieDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt="Your profile photo"
                  src={p.selfieDataUrl}
                  className="aspect-square w-full rounded-2xl object-cover border border-[var(--border)]"
                />
              ) : (
                <div className="grid aspect-square w-full place-items-center rounded-2xl bg-[var(--border-subtle)] text-base font-semibold text-[var(--foreground-muted)] border border-[var(--border)]">
                  No photo
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div
                className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]"
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
              >
                {p?.name ?? "Your name"}{" "}
                {typeof p?.age === "number" ? (
                  <span className="text-[var(--foreground-muted)]">· {p.age}</span>
                ) : null}
              </div>
              <div className="mt-1 text-base font-semibold text-[var(--foreground-muted)]">
                {p?.city ?? "Your city"}
              </div>

              {p?.bio ? (
                <p className="mt-4 text-base text-[var(--foreground)] leading-relaxed">
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
          {email ? (
            <div className="flex flex-col gap-1">
              <div className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
                Signed in as
              </div>
              <div
                className="text-lg font-bold text-[var(--foreground)] break-all"
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
              >
                {email}
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/profile/edit">
              <PrimaryButton variant="secondary">Edit profile</PrimaryButton>
            </Link>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {email ? (
                <PrimaryButton variant="secondary" onClick={handleLogOut}>
                  Log out
                </PrimaryButton>
              ) : null}
              <PrimaryButton
                variant="danger"
                onClick={() => {
                  clearProfile();
                  setProfile(loadProfile());
                }}
              >
                Delete profile
              </PrimaryButton>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

