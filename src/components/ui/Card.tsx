import { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6",
        "shadow-sm hover:shadow-md transition-shadow duration-200",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}

