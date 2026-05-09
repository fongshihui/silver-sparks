import { ReactNode } from "react";

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1.5 text-sm font-semibold text-orange-700 border border-orange-100 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-900/40">
      {children}
    </span>
  );
}

