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
        "rounded-3xl bg-white p-5 ring-1 ring-zinc-200 shadow-sm",
        "dark:bg-zinc-900 dark:ring-zinc-800",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}

