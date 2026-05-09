import { ReactNode } from "react";

export function BottomBarCTA({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-4 mt-6 border-t border-zinc-200 bg-white/90 px-4 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 sm:-mx-6 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">{children}</div>
    </div>
  );
}

