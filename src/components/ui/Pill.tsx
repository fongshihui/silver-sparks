import { ReactNode } from "react";

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-2 text-base font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
      {children}
    </span>
  );
}

