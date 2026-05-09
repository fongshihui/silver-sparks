export function ProgressDots({
  total,
  activeIndex,
}: {
  total: number;
  activeIndex: number;
}) {
  return (
    <div className="flex items-center justify-center gap-2" aria-label="Progress">
      {Array.from({ length: total }).map((_, i) => {
        const active = i === activeIndex;
        return (
          <span
            key={i}
            className={[
              "h-2.5 rounded-full transition-all",
              active ? "w-7 bg-[var(--accent)]" : "w-2.5 bg-zinc-300",
              "dark:" + (active ? "bg-[var(--accent)]" : "bg-zinc-700"),
            ].join(" ")}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}

