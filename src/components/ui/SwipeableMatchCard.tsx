"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import type { RankedMatch } from "@/lib/matchRanking";

type SwipeableMatchCardProps = {
  m: RankedMatch;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  playText: (text: string) => void;
  zIndex: number;
};

export function SwipeableMatchCard({
  m,
  onSwipeLeft,
  onSwipeRight,
  playText,
  zIndex,
}: SwipeableMatchCardProps) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-150, 0, 150], [0.55, 1, 0.55]);
  const rotate = useTransform(x, [-200, 200], [-8, 8]);
  const skipOpacity = useTransform(x, [-140, -50, 0], [0.9, 0.4, 0]);
  const likeOpacity = useTransform(x, [0, 50, 140], [0, 0.4, 0.9]);

  const [exitX, setExitX] = useState<number | null>(null);

  return (
    <motion.div
      style={{
        x,
        opacity,
        rotate,
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex,
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 100) {
          setExitX(320);
          onSwipeRight();
        } else if (info.offset.x < -100) {
          setExitX(-320);
          onSwipeLeft();
        }
      }}
      animate={exitX ? { x: exitX, opacity: 0 } : undefined}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className="h-[500px] w-full cursor-grab active:cursor-grabbing"
    >
      <Card className="relative flex h-full flex-col justify-between overflow-hidden !rounded-2xl !border-[var(--border)] bg-[var(--surface)] !p-6 shadow-lg">
        <motion.div
          className="pointer-events-none absolute inset-0 flex items-center justify-start pl-8"
          style={{ opacity: skipOpacity }}
        >
          <span
            className="text-8xl font-black text-zinc-400/30"
            aria-hidden
          >
            ✕
          </span>
        </motion.div>
        <motion.div
          className="pointer-events-none absolute inset-0 flex items-center justify-end pr-8"
          style={{ opacity: likeOpacity }}
        >
          <span
            className="text-7xl text-[var(--accent)]/40"
            aria-hidden
          >
            ♥
          </span>
        </motion.div>

        <div className="relative flex flex-col gap-4">
          <div
            className="text-3xl font-extrabold tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            {m.name} <span className="text-[var(--foreground-muted)]">· {m.age}</span>
          </div>
          <div className="text-base text-[var(--foreground-muted)]">
            {m.city} · ~{m.distanceKm} km away
          </div>
          <p className="mt-2 text-base leading-relaxed text-[var(--foreground)]">
            {m.about}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {m.interests.map((tag) => (
              <Pill key={tag}>{tag}</Pill>
            ))}
          </div>
        </div>

        <div className="relative mt-4 flex justify-between gap-2 border-t border-[var(--border)] pt-4">
          <PrimaryButton
            variant="secondary"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              playText(`${m.name}. ${m.about}`);
            }}
          >
            Read aloud
          </PrimaryButton>
        </div>
      </Card>
    </motion.div>
  );
}
